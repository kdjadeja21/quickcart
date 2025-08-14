export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  locale?: string; // BCP 47 language tag
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, locale: 'en-US' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, locale: 'en-CA' },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, locale: 'ja-JP' },  
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, locale: 'en-AU' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2, locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, locale: 'zh-CN' },  
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, locale: 'pt-BR' },
];

export function formatCurrency(amount: number, currency: Currency): string {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formattedNumber = absoluteAmount.toLocaleString(currency.locale || 'en-US', {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
    useGrouping: true,
  });
  return `${isNegative ? '-' : ''}${currency.symbol}${formattedNumber}`;
}

export function getCurrencyByCode(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}
