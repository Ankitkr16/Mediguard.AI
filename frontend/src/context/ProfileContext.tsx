import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface FamilyProfile {
  id: number;
  user_id: number;
  relation: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
}

interface ProfileContextType {
  profiles: FamilyProfile[];
  currentProfile: FamilyProfile | null;
  loading: boolean;
  refreshProfiles: () => Promise<void>;
  selectProfile: (profileId: number) => void;
  createProfile: (relation: string, fullName: string, age?: number, gender?: string, weight?: number, height?: number) => Promise<boolean>;
  deleteProfile: (profileId: number) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, fetchWithAuth } = useAuth();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setCurrentProfile(null);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchWithAuth('/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        
        // Auto-select active profile from localStorage if valid, else select the default "Self" profile
        const savedProfileIdStr = localStorage.getItem('activeProfileId');
        let activeProfile = null;
        if (savedProfileIdStr) {
          const savedId = parseInt(savedProfileIdStr, 10);
          activeProfile = data.find((p: FamilyProfile) => p.id === savedId);
        }
        
        if (!activeProfile && data.length > 0) {
          // Find "Self" profile or use the first one
          activeProfile = data.find((p: FamilyProfile) => p.relation === 'Self') || data[0];
        }
        
        if (activeProfile) {
          setCurrentProfile(activeProfile);
          localStorage.setItem('activeProfileId', activeProfile.id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load family profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (profileId: number) => {
    const active = profiles.find(p => p.id === profileId);
    if (active) {
      setCurrentProfile(active);
      localStorage.setItem('activeProfileId', active.id.toString());
    }
  };

  const createProfile = async (
    relation: string,
    fullName: string,
    age?: number,
    gender?: string,
    weight?: number,
    height?: number
  ): Promise<boolean> => {
    try {
      const res = await fetchWithAuth('/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relation,
          full_name: fullName,
          age,
          gender,
          weight,
          height
        })
      });
      if (res.ok) {
        await refreshProfiles();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const deleteProfile = async (profileId: number): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`/profiles/${profileId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshProfiles();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Sync profiles when user logs in
  useEffect(() => {
    if (user) {
      refreshProfiles();
    } else {
      setProfiles([]);
      setCurrentProfile(null);
    }
  }, [user]);

  return (
    <ProfileContext.Provider value={{
      profiles,
      currentProfile,
      loading,
      refreshProfiles,
      selectProfile,
      createProfile,
      deleteProfile
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
