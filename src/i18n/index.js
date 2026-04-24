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
  // Don't fall back to sw when in English mode — show key as-is if missing
  return translations[lang][key] || key;
};
