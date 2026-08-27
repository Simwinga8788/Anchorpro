// Shared currency formatting for the tenant's Base Currency setting (Org.Currency).
export type CurrencyCode = 'ZMW' | 'USD' | 'ZAR' | 'KES' | 'GBP';

export const DEFAULT_CURRENCY: CurrencyCode = 'ZMW';

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZMW: 'K',
  USD: '$',
  ZAR: 'R',
  KES: 'KSh',
  GBP: '£',
};

const CURRENCY_LOCALES: Record<string, string> = {
  ZMW: 'en-ZM',
  USD: 'en-US',
  ZAR: 'en-ZA',
  KES: 'en-KE',
  GBP: 'en-GB',
};

export function getCurrencySymbol(code?: string | null): string {
  const key = (code || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCY_SYMBOLS[key] || key;
}

export function formatCurrency(
  amount: number | string | null | undefined,
  code?: string | null,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const key = (code || DEFAULT_CURRENCY).toUpperCase();
  const symbol = getCurrencySymbol(key);
  const locale = CURRENCY_LOCALES[key] || CURRENCY_LOCALES[DEFAULT_CURRENCY];
  const n = Number(amount || 0);
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = opts || {};
  return `${symbol} ${n.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits })}`;
}
