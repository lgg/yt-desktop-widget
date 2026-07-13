import { createContext, useContext, useEffect, useMemo } from 'react';

import type { Locale } from '@/domain/playback/types';
import englishMessages from '@/locales/en.json';
import russianMessages from '@/locales/ru.json';

type MessageTree = typeof englishMessages;
type TranslationValues = Record<string, string | number>;

interface I18nContextValue {
  t: (key: string, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
});

const messagesByLocale: Record<Locale, MessageTree> = {
  en: englishMessages,
  ru: russianMessages,
};

const resolveMessage = (key: string, tree: MessageTree): string => {
  const resolved = key.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, tree);

  return typeof resolved === 'string' ? resolved : key;
};

const applyValues = (message: string, values?: TranslationValues) => {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (result, [token, value]) =>
      result.replaceAll(`{{${token}}}`, String(value)),
    message,
  );
};

export const I18nProvider = ({
  children,
  locale = 'en',
}: React.PropsWithChildren<{ locale?: Locale }>) => {
  const activeLocale = messagesByLocale[locale] ? locale : 'en';
  const messages = messagesByLocale[activeLocale];
  const value = useMemo<I18nContextValue>(
    () => ({
      t: (key, values) => applyValues(resolveMessage(key, messages), values),
    }),
    [messages],
  );

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
