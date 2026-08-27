'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsApi } from './api';
import { useAuth } from './AuthContext';
import { DEFAULT_CURRENCY, formatCurrency, getCurrencySymbol } from './currency';

interface DictionaryContextType {
  dict: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  refreshDictionary: () => Promise<void>;
  workspaceName: string;
  currency: string;
  currencySymbol: string;
  formatMoney: (amount: number | string | null | undefined, opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string;
}

const DictionaryContext = createContext<DictionaryContextType>({
  dict: {},
  t: (key, fallback) => fallback || key,
  refreshDictionary: async () => {},
  workspaceName: 'Anchor Pro',
  currency: DEFAULT_CURRENCY,
  currencySymbol: getCurrencySymbol(DEFAULT_CURRENCY),
  formatMoney: (amount, opts) => formatCurrency(amount, DEFAULT_CURRENCY, opts),
});

export const DictionaryProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [dict, setDict] = useState<Record<string, string>>({});
  const [workspaceName, setWorkspaceName] = useState<string>('Anchor Pro');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  const refreshDictionary = async () => {
    if (!user) {
      setDict({});
      setWorkspaceName('Anchor Pro');
      setCurrency(DEFAULT_CURRENCY);
      return;
    }

    try {
      const allSettings = await settingsApi.getAll();
      const newDict: Record<string, string> = {};
      let name = 'Anchor Pro';
      let curr = DEFAULT_CURRENCY;

      allSettings.forEach((setting: any) => {
        if (setting.key.startsWith('Dict.')) {
          const termKey = setting.key.replace('Dict.', '');
          newDict[termKey] = setting.value;
        } else if (setting.key === 'Org.Name') {
          name = setting.value;
        } else if (setting.key === 'Org.Currency' && setting.value) {
          curr = setting.value;
        }
      });

      setDict(newDict);
      setWorkspaceName(name);
      setCurrency(curr);
    } catch (e) {
      console.error("Failed to load dictionary settings", e);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    refreshDictionary();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return dict[key] || fallback || key;
  };

  const currencySymbol = getCurrencySymbol(currency);
  const formatMoney = (amount: number | string | null | undefined, opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) =>
    formatCurrency(amount, currency, opts);

  return (
    <DictionaryContext.Provider value={{ dict, t, refreshDictionary, workspaceName, currency, currencySymbol, formatMoney }}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => useContext(DictionaryContext);
