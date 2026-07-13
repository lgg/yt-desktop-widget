import { render, screen } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type ComponentType, type PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';

import { I18nProvider, useI18n } from '@/app/i18n';
import englishMessages from '@/locales/en.json';

const TestMessage = () => {
  const { t } = useI18n();
  return <span>{t('app.settings')}</span>;
};

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
};

describe('i18n', () => {
  it('uses Russian messages when Russian is selected', () => {
    const LocalizedProvider = I18nProvider as ComponentType<
      PropsWithChildren<{ locale: 'en' | 'ru' }>
    >;

    render(
      <LocalizedProvider locale="ru">
        <TestMessage />
      </LocalizedProvider>,
    );

    expect(screen.getByText('Настройки')).toBeInTheDocument();
  });

  it('keeps English and Russian locale keys in exact parity', () => {
    const russianPath = resolve(process.cwd(), 'src/locales/ru.json');
    expect(existsSync(russianPath)).toBe(true);
    if (!existsSync(russianPath)) {
      return;
    }

    const russianMessages = JSON.parse(
      readFileSync(russianPath, 'utf8'),
    ) as unknown;
    expect(flattenKeys(russianMessages).sort()).toEqual(
      flattenKeys(englishMessages).sort(),
    );
  });
});
