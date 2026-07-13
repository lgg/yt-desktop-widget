import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { APP_VERSION } from '@/app/defaults';
import packageJson from '../../package.json';
import tauriConfig from '../../src-tauri/tauri.conf.json';

describe('application version', () => {
  it('uses root package.json as the source of truth', () => {
    const cargoManifest = readFileSync(
      resolve(process.cwd(), 'src-tauri/Cargo.toml'),
      'utf8',
    );
    const cargoLock = readFileSync(
      resolve(process.cwd(), 'src-tauri/Cargo.lock'),
      'utf8',
    );
    const packageLock = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package-lock.json'), 'utf8'),
    ) as { version: string; packages: Record<string, { version?: string }> };
    const companionSource = readFileSync(
      resolve(process.cwd(), 'src-tauri/src/companion.rs'),
      'utf8',
    );
    const escapedVersion = packageJson.version.replaceAll('.', '\\.');

    expect(APP_VERSION).toBe(packageJson.version);
    expect(tauriConfig.version).toBe('../package.json');
    expect(cargoManifest).toMatch(
      new RegExp(`\\[package\\][\\s\\S]*?version = "${escapedVersion}"`),
    );
    expect(cargoLock).toMatch(
      new RegExp(
        `name = "ytm-desktop-widget"\\r?\\nversion = "${escapedVersion}"`,
      ),
    );
    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages['']?.version).toBe(packageJson.version);
    expect(companionSource).toContain('env!("CARGO_PKG_VERSION")');
    expect(packageJson.scripts['version:check']).toBeTypeOf('string');
  });
});
