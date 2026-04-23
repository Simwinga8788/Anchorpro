'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from './api';
import { useAuth } from './AuthContext';

interface DictionaryContextType {
  dict: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  refreshDictionary: () => Promise<void>;
}

const DictionaryContext = createContext<DictionaryContextType>({
  dict: {},
  t: (key, fallback) => fallback || key,
  refreshDictionary: async () => {},
});

export const DictionaryProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [dict, setDict] = useState<Record<string, string>>({});

  const refreshDictionary = async () => {
    if (!user) {
      setDict({});
      return;
    }
    
    try {
      const allSettings = await settingsApi.getAllSettings();
      const newDict: Record<string, string> = {};
      
      // Filter settings that look like dictionary overrides (e.g., "Dict.Equipment" = "Vehicle")
      allSettings.forEach((setting: any) => {
        if (setting.key.startsWith('Dict.')) {
          const termKey = setting.key.replace('Dict.', '');
          newDict[termKey] = setting.value;
        }
      });
      
      setDict(newDict);
    } catch (e) {
      console.error("Failed to load dictionary settings", e);
    }
  };

  useEffect(() => {
    refreshDictionary();
  }, [user]);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return dict[key] || fallback || key;
  };

  return (
    <DictionaryContext.Provider value={{ dict, t, refreshDictionary }}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => useContext(DictionaryContext);
