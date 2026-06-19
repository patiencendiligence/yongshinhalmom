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

const STORAGE_KEY = "yongshin_profiles";
const CACHE_KEY = "yongshin_report_cache";
const PAID_KEY = "yongshin_paid_hashes";

export interface ReportCacheEntry {
  inputHash: string;
  year: number;
  level: 'simple' | 'detailed';
  date: string; // YYYY-MM-DD
  result: any;
}

export const storageService = {
  getProfiles: (): UserProfile[] => {
    const data = localStorage.getItem(STORAGE_KEY);
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
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([newProfile, ...profiles]));
  },

  deleteProfile: (id: string) => {
    const profiles = storageService.getProfiles();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.filter(p => p.id !== id)));
  },

  // Paid tracking logic
  getPaidHashes: (): string[] => {
    const data = localStorage.getItem(PAID_KEY);
    return data ? JSON.parse(data) : [];
  },

  setPaidHash: (hash: string) => {
    if (!hash) return;
    const hashes = storageService.getPaidHashes();
    if (!hashes.includes(hash)) {
      localStorage.setItem(PAID_KEY, JSON.stringify([...hashes, hash]));
    }
  },

  isLocalPaid: (hash: string): boolean => {
    if (!hash) return false;
    return storageService.getPaidHashes().includes(hash);
  },

  // Caching logic
  getReportCache: (): ReportCacheEntry[] => {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },

  setReportCache: (entry: ReportCacheEntry) => {
    const cache = storageService.getReportCache();
    const filtered = cache.filter(e => e.inputHash !== entry.inputHash || e.year !== entry.year || e.level !== entry.level);
    localStorage.setItem(CACHE_KEY, JSON.stringify([entry, ...filtered]));
  },

  findCachedReport: (data: any, year: number, level: 'simple' | 'detailed'): any | null => {
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
          localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
          return null;
        }
      }
      return entry.result;
    }
    return null;
  }
};
