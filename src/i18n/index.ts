import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { resources } from './resources';

const deviceLanguage = Localization.getLocales()[0]?.languageCode;

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage === 'de' ? 'de' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
