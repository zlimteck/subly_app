import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Function to detect browser language
const getBrowserLanguage = () => {
  // Get the browser language (e.g., "fr-FR", "en-US", "fr", "en")
  const browserLang = navigator.language || navigator.userLanguage;

  // Extract just the language code (e.g., "fr" from "fr-FR")
  const langCode = browserLang.split('-')[0];

  // Only return supported languages, otherwise return 'en'
  const supportedLanguages = ['en', 'fr'];
  return supportedLanguages.includes(langCode) ? langCode : 'en';
};

// Get saved language from localStorage, or detect from browser, or default to English
const savedLanguage = localStorage.getItem('language');
const detectedLanguage = savedLanguage || getBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      }
    },
    lng: detectedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;