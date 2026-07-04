import { createContext, useContext } from 'react';

import messages from '@/locales/en.json';

type MessageTree = typeof messages;
type TranslationValues = Record<string, string | number>;

interface I18nContextValue {
  t: (key: string, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
});

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
    (result, [token, value]) => result.replaceAll(`{{${token}}}`, String(value)),
    message,
  );
};

export const I18nProvider = ({ children }: React.PropsWithChildren) => {
  const value: I18nContextValue = {
    t: (key, values) => applyValues(resolveMessage(key, messages), values),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
