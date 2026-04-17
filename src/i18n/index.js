import { sw } from './sw';
import { en } from './en';

// Placeholders for future languages
export const ar = { ...en }; // Arabic
export const fr = { ...en }; // French
export const zh = { ...en }; // Chinese

export const translations = {
  sw,
  en,
  ar,
  fr,
  zh
};

export const getTranslation = (lang, key) => {
  if (!translations[lang]) return key;
  return translations[lang][key] || translations['sw'][key] || key;
};
