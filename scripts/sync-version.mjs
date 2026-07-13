import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const version = packageJson.version;

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`package.json contains an invalid semantic version: ${String(version)}`);
}

const replacements = [
  {
    file: 'package-lock.json',
    update(content) {
      let replacementCount = 0;
      const updated = content.replace(/("version": ")[^"]+("[\s\S]*?"packages": \{[\s\S]*?"": \{[\s\S]*?"name": "ytm-desktop-widget",[\r\n]+\s+"version": ")[^"]+("),/, (...args) => {
        replacementCount += 1;
        return `${args[1]}${version}${args[2]}${version}${args[3]},`;
      });
      assertOneReplacement('package-lock.json', replacementCount);
      return updated;
    },
  },
  {
    file: 'src-tauri/Cargo.toml',
    update(content) {
      return replaceOne(
        content,
        /(\[package\][\s\S]*?^version\s*=\s*")[^"]+("[ \t]*$)/m,
        (_match, before, after) => `${before}${version}${after}`,
        'src-tauri/Cargo.toml',
      );
    },
  },
  {
    file: 'src-tauri/Cargo.lock',
    update(content) {
      return replaceOne(
        content,
        /(\[\[package\]\][\r\n]+name = "ytm-desktop-widget"[\r\n]+version = ")[^"]+("[ \t]*$)/m,
        (_match, before, after) => `${before}${version}${after}`,
        'src-tauri/Cargo.lock',
      );
    },
  },
  {
    file: 'src-tauri/tauri.conf.json',
    update(content) {
      return replaceOne(
        content,
        /("version": ")[^"]+("\s*,)/,
        (_match, before, after) => `${before}../package.json${after}`,
        'src-tauri/tauri.conf.json',
      );
    },
  },
];

const driftedFiles = [];

for (const target of replacements) {
  const filePath = path.join(root, target.file);
  const content = await readFile(filePath, 'utf8');
  const expected = target.update(content);

  if (content === expected) {
    continue;
  }

  driftedFiles.push(target.file);
  if (!checkOnly) {
    await writeFile(filePath, expected, 'utf8');
  }
}

if (checkOnly && driftedFiles.length > 0) {
  throw new Error(
    `Version ${version} from package.json is not synchronized in: ${driftedFiles.join(', ')}. Run npm run version:sync.`,
  );
}

if (checkOnly) {
  console.log(`Version ${version} is synchronized.`);
} else if (driftedFiles.length === 0) {
  console.log(`Version ${version} was already synchronized.`);
} else {
  console.log(`Synchronized version ${version} in: ${driftedFiles.join(', ')}.`);
}

function replaceOne(content, pattern, replacement, file) {
  let replacementCount = 0;
  const updated = content.replace(pattern, (...args) => {
    replacementCount += 1;
    return replacement(...args);
  });
  assertOneReplacement(file, replacementCount);
  return updated;
}

function assertOneReplacement(file, replacementCount) {
  if (replacementCount !== 1) {
    throw new Error(`Expected exactly one version target in ${file}, found ${replacementCount}.`);
  }
}
