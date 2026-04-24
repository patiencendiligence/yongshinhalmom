export interface UserProfile {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  isLunar: boolean;
  gender: string;
  birthPlace: string;
  createdAt: number;
}

const STORAGE_KEY = "yongshin_profiles";
const CACHE_KEY = "yongshin_report_cache";

export interface ReportCacheEntry {
  inputHash: string;
  year: number;
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
      p.name === profile.name && 
      p.birthDate === profile.birthDate && 
      p.birthTime === profile.birthTime
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

  // Caching logic
  getReportCache: (): ReportCacheEntry[] => {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },

  setReportCache: (entry: ReportCacheEntry) => {
    const cache = storageService.getReportCache();
    const filtered = cache.filter(e => e.inputHash !== entry.inputHash || e.year !== entry.year);
    localStorage.setItem(CACHE_KEY, JSON.stringify([entry, ...filtered]));
  },

  findCachedReport: (data: any, year: number): any | null => {
    const hash = JSON.stringify({
      name: data.name,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      isLunar: data.isLunar,
      gender: data.gender
    });
    const today = new Date().toISOString().split('T')[0];
    const cache = storageService.getReportCache();
    const entry = cache.find(e => e.inputHash === hash && e.year === year && e.date === today);
    return entry ? entry.result : null;
  }
};
