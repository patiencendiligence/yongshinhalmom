export interface UserProfile {
  id: string;
  name?: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  targetYear: number;
  createdAt: number;
}

export const STORAGE_KEYS = {
  PROFILES: "yongshin_profiles",
  REPORT_CACHE: "yongshin_report_cache",
  PAID_HASHES: "yongshin_paid_hashes",
  PENDING_STATE: "yongshin_pending_state",
  PENDING_PAY_HASH: "yongshin_pending_pay_hash",
  TODAY_CUSTOM_QUESTION: "yongshin_today_custom_question",
  LAST_QUESTION_ASKED_DATE: "yongshin_last_question_asked_date",
} as const;

const STORAGE_KEY = STORAGE_KEYS.PROFILES;
const CACHE_KEY = STORAGE_KEYS.REPORT_CACHE;
const PAID_KEY = STORAGE_KEYS.PAID_HASHES;

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  }
};

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(key);
    }
  }
};

export interface ReportCacheEntry {
  inputHash: string;
  year: number;
  level: 'simple' | 'detailed';
  date: string; // YYYY-MM-DD
  result: any;
}

export const storageService = {
  getProfiles: (): UserProfile[] => {
    const data = safeLocalStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProfile: (profile: Omit<UserProfile, "id" | "createdAt">) => {
    const profiles = storageService.getProfiles();
    const isDuplicate = profiles.find(p => 
      p.birthDate === profile.birthDate && 
      p.birthTime === profile.birthTime &&
      p.gender === profile.gender &&
      p.birthPlace === profile.birthPlace
    );

    if (isDuplicate) return;

    const newProfile: UserProfile = {
      ...profile,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: Date.now()
    };

    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify([newProfile, ...profiles]));
  },

  deleteProfile: (id: string) => {
    const profiles = storageService.getProfiles();
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.filter(p => p.id !== id)));
  },

  // Paid tracking logic
  getPaidHashes: (): string[] => {
    const data = safeLocalStorage.getItem(PAID_KEY);
    return data ? JSON.parse(data) : [];
  },

  setPaidHash: (hash: string) => {
    if (!hash) return;
    const hashes = storageService.getPaidHashes();
    if (!hashes.includes(hash)) {
      safeLocalStorage.setItem(PAID_KEY, JSON.stringify([...hashes, hash]));
    }
  },

  isLocalPaid: (hash: string): boolean => {
    if (!hash) return false;
    return storageService.getPaidHashes().includes(hash);
  },

  // Caching logic
  getReportCache: (): ReportCacheEntry[] => {
    const data = safeLocalStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },

  setReportCache: (entry: ReportCacheEntry) => {
    const cache = storageService.getReportCache();
    const filtered = cache.filter(e => e.inputHash !== entry.inputHash || e.year !== entry.year || e.level !== entry.level);
    safeLocalStorage.setItem(CACHE_KEY, JSON.stringify([entry, ...filtered]));
  },

  findCachedReport: (data: any, year: number, level: 'simple' | 'detailed'): any | null => {
    if (data.customQuestion && data.customQuestion.trim()) {
      return null;
    }
    const hash = JSON.stringify({
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      isLunar: data.isLunar,
      gender: data.gender
    });
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const today = kstNow.toISOString().split('T')[0];
    const cache = storageService.getReportCache();
    const entry = cache.find(e => e.inputHash === hash && e.year === year && e.date === today && (e.level === level || e.level === 'detailed'));
    
    if (entry) {
      if (level === 'detailed' || entry.level === 'detailed') {
        const hasAnalysis = entry.result && (
          entry.result.analysis || 
          entry.result['심층 사주 분석'] || 
          entry.result['Deep Saju Analysis'] ||
          (entry.result && typeof entry.result === 'object' && Object.keys(entry.result).some(key => !['summary', 'sections', 'luckInfo', 'todaysFortune', 'zodiac', 'title', 'content', 'id', 'level', 'language', 'createdAt', 'userId', 'paymentStatus'].includes(key) && typeof entry.result[key] === 'object'))
        );
        if (!hasAnalysis) {
          console.log("[StorageService] Cached report is marked 'detailed' but lacks 'analysis' data. Busting cache to fetch new one from server.");
          const filtered = cache.filter(e => e.inputHash !== entry.inputHash || e.year !== entry.year || e.level !== entry.level);
          safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
          return null;
        }
      }
      return entry.result;
    }
    return null;
  },

  // Pending State & Session Helpers
  getPendingState: (): any | null => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.PENDING_STATE) || safeSessionStorage.getItem(STORAGE_KEYS.PENDING_STATE);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setPendingState: (stateObj: any) => {
    safeLocalStorage.setItem(STORAGE_KEYS.PENDING_STATE, JSON.stringify(stateObj));
    safeSessionStorage.setItem(STORAGE_KEYS.PENDING_STATE, JSON.stringify(stateObj));
  },

  clearPendingState: () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.PENDING_STATE);
    safeSessionStorage.removeItem(STORAGE_KEYS.PENDING_STATE);
  },

  getPendingPayHash: (): string | null => {
    return safeLocalStorage.getItem(STORAGE_KEYS.PENDING_PAY_HASH) || safeSessionStorage.getItem(STORAGE_KEYS.PENDING_PAY_HASH);
  },

  setPendingPayHash: (hash: string) => {
    if (!hash) return;
    safeLocalStorage.setItem(STORAGE_KEYS.PENDING_PAY_HASH, hash);
    safeSessionStorage.setItem(STORAGE_KEYS.PENDING_PAY_HASH, hash);
  },

  clearPendingPayHash: () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.PENDING_PAY_HASH);
    safeSessionStorage.removeItem(STORAGE_KEYS.PENDING_PAY_HASH);
  }
};
