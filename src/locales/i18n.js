import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_LANGUAGE_KEY = 'settings.lang';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
