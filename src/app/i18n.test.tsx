import { render, screen } from '@testing-library/react';
import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type ComponentType, type PropsWithChildren } from 'react';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { I18nProvider, useI18n } from '@/app/i18n';
import englishMessages from '@/locales/en.json';
import russianMessages from '@/locales/ru.json';

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

const flattenMessages = (
  value: unknown,
  prefix = '',
): Record<string, string> => {
  if (typeof value === 'string') {
    return prefix ? { [prefix]: value } : {};
  }

  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const flattened: Record<string, string> = {};
  for (const [key, nested] of Object.entries(value)) {
    Object.assign(
      flattened,
      flattenMessages(nested, prefix ? `${prefix}.${key}` : key),
    );
  }
  return flattened;
};

const interpolationTokens = (message: string) =>
  [...message.matchAll(/{{\s*([\w.]+)\s*}}/g)].map((match) => match[1]).sort();

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

  it('keeps every locale message non-empty with matching interpolation tokens', () => {
    const english = flattenMessages(englishMessages);
    const russian = flattenMessages(russianMessages);

    for (const [key, message] of Object.entries(english)) {
      expect(message.trim(), `English message ${key}`).not.toBe('');
      expect(russian[key]?.trim(), `Russian message ${key}`).not.toBe('');
      expect(interpolationTokens(russian[key] ?? ''), key).toEqual(
        interpolationTokens(message),
      );
    }
  });

  it('resolves every statically referenced translation key', () => {
    const knownKeys = new Set(flattenKeys(englishMessages));
    const missingKeys = globSync('src/**/*.{ts,tsx}', {
      exclude: ['src/**/*.test.{ts,tsx}'],
    }).flatMap((filePath) => {
      const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');
      return [...source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)]
        .map((match) => match[1])
        .filter((key): key is string => Boolean(key))
        .filter((key) => !knownKeys.has(key))
        .map((key) => `${filePath}: ${key}`);
    });

    expect(missingKeys).toEqual([]);
  });

  it('does not embed user-facing JSX text or literal accessibility copy', () => {
    const findings: string[] = [];

    for (const filePath of globSync('src/**/*.tsx', {
      exclude: ['src/**/*.test.tsx'],
    })) {
      const source = readFileSync(resolve(process.cwd(), filePath), 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );

      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && /[A-Za-zА-Яа-яЁё]/.test(node.text)) {
          findings.push(`${filePath}: ${node.text.trim()}`);
        }

        if (
          ts.isJsxAttribute(node) &&
          ['aria-label', 'placeholder', 'title'].includes(
            node.name.getText(),
          ) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer)
        ) {
          findings.push(`${filePath}: ${node.initializer.text}`);
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(findings).toEqual([]);
  });
});
