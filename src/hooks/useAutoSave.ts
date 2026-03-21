import { useState, useEffect } from 'react';

/**
 * Hook to auto-save form drafts to localStorage
 */
export function useAutoSave(key: string, initialValue: string = '', delay: number = 1000) {
  const [value, setValue] = useState<string>(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved : initialValue;
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Se o valor for o inicial, não precisamos marcar como recém-salvo 
    // a menos que tenha havido mudança.
    const handler = setTimeout(() => {
      localStorage.setItem(key, value);
      if (value !== '') {
        setIsSaved(true);
        // Remove o "salvo" após 2 segundos para dar feedback visual
        const timer = setTimeout(() => setIsSaved(false), 2000);
        return () => clearTimeout(timer);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
      setIsSaved(false); // Reinicia ao mudar valor
    };
  }, [key, value, delay]);

  const clearSave = () => {
    localStorage.removeItem(key);
    setValue('');
    setIsSaved(false);
  };

  return [value, setValue, clearSave, isSaved] as const;
}
