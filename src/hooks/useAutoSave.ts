import { useState, useEffect } from 'react';

/**
 * Hook to auto-save form drafts to localStorage
 * @param key LocalStorage key
 * @param initialValue Default value if none exists in storage
 * @param delay Debounce delay for saving
 */
export function useAutoSave(key: string, initialValue: string = '', delay: number = 1000) {
  const [value, setValue] = useState<string>(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved : initialValue;
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem(key, value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [key, value, delay]);

  const clearSave = () => {
    localStorage.removeItem(key);
    setValue('');
  };

  return [value, setValue, clearSave] as const;
}
