import { useState, useEffect } from "react";
import { storageService, UserProfile } from "../services/storageService";

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    return storageService.getProfiles();
  });

  const refreshProfiles = () => {
    setProfiles(storageService.getProfiles());
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const saveProfile = (data: any) => {
    storageService.saveProfile(data);
    refreshProfiles();
  };

  const deleteProfile = (id: string) => {
    storageService.deleteProfile(id);
    refreshProfiles();
  };

  return { profiles, saveProfile, deleteProfile, refreshProfiles };
}
