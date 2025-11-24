"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StorageContextType {
  storageUsed: number;
  maxStorage: number;
  refreshStorage: () => Promise<void>;
  userName: string;
  email: string;
  loading: boolean;
  profilePicture: string;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const minStorage = 5 * 1024 * 1024 * 1024;
  const [storageUsed, setStorageUsed] = useState(0);
  const [maxStorage, setMaxStorage] = useState(minStorage);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("")
  const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  const refreshStorage = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("storage_used, max_storage, username, email, profile_picture")
        .eq("id", user.id)
        .single();

      if (data) {
        setStorageUsed(data.storage_used || 0);
        setMaxStorage(data.max_storage || minStorage);
        setEmail(data.email);
        setUserName(data.username);
        setProfilePicture(data.profile_picture);
      }
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  return (
    <StorageContext.Provider value={{ storageUsed, maxStorage, refreshStorage, userName, email, loading, profilePicture }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return context;
}