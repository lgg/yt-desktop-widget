import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { APP_VERSION } from '@/app/defaults';
import packageJson from '../../package.json';
import tauriConfig from '../../src-tauri/tauri.conf.json';

describe('application version', () => {
  it('uses root package.json as the 2.0.0 source of truth', () => {
    const cargoManifest = readFileSync(
      resolve(process.cwd(), 'src-tauri/Cargo.toml'),
      'utf8',
    );
    const companionSource = readFileSync(
      resolve(process.cwd(), 'src-tauri/src/companion.rs'),
      'utf8',
    );

    expect(packageJson.version).toBe('2.0.0');
    expect(APP_VERSION).toBe(packageJson.version);
    expect(tauriConfig.version).toBe('../package.json');
    expect(cargoManifest).toMatch(/\[package\][\s\S]*?version = "2\.0\.0"/);
    expect(companionSource).toContain('env!("CARGO_PKG_VERSION")');
    expect(packageJson.scripts['version:check']).toBeTypeOf('string');
  });
});
