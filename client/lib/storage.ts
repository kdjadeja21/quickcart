export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
}

export interface AppSettings {
  currency: string;
  theme: 'dark' | 'light' | 'system';
}

const STORAGE_KEYS = {
  ITEMS: 'shopping-list-items',
  SETTINGS: 'shopping-list-settings'
} as const;

export function saveItems(items: ShoppingItem[]): void {
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
}

export function loadItems(): ShoppingItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!data) return [];
    
    const items = JSON.parse(data);
    return items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt)
    }));
  } catch (error) {
    console.error('Error loading items from localStorage:', error);
    return [];
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return { currency: 'USD', theme: 'system' };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    return { currency: 'USD', theme: 'system' };
  }
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
