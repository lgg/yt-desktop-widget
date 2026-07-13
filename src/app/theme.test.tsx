import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from '@/app/theme';
import type { ThemeMode } from '@/domain/playback/types';

const ThemeProbe = () => {
  const { effectiveTheme } = useTheme();
  return <span>{effectiveTheme}</span>;
};

describe('ThemeProvider', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    vi.unstubAllGlobals();
  });

  it('keeps an explicit light theme even when Windows prefers dark', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(
      <ThemeProvider mode={'light' as ThemeMode}>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
