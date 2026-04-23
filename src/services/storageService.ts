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
  }
};
