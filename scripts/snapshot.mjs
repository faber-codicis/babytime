// Local backup instead of git: copies project sources to ../babytime-snapshots/<stamp>_v<version>/
// Keeps the newest 20 snapshots. Node built-ins only.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP = 20;
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotRoot = resolve(projectDir, '..', 'babytime-snapshots');

const ENTRIES = [
  'src',
  'public',
  'scripts',
  'tests',
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'wrangler.jsonc',
  'spec.md',
  'tsconfig.json',
  'eslint.config.js',
  'vitest.config.ts',
  'playwright.config.ts',
  'README.md',
  'DECISIONS.md',
];

const EXCLUDED = new Set(['node_modules', 'dist', '.wrangler', '.git']);

function isExcluded(path) {
  const name = path.split(/[\\/]/).pop() ?? '';
  return EXCLUDED.has(name) || name.startsWith('.env');
}

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const { version } = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'));

let target = join(snapshotRoot, `${stamp}_v${version}`);
for (let i = 2; existsSync(target); i++) target = join(snapshotRoot, `${stamp}_v${version}_${i}`);
mkdirSync(target, { recursive: true });

let copied = 0;
for (const entry of ENTRIES) {
  const src = join(projectDir, entry);
  if (!existsSync(src)) continue;
  cpSync(src, join(target, entry), { recursive: true, filter: (p) => !isExcluded(p) });
  copied++;
}

// Prune: only touches directories inside our own snapshot folder.
const snapshots = readdirSync(snapshotRoot)
  .map((name) => join(snapshotRoot, name))
  .filter((p) => statSync(p).isDirectory())
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
for (const old of snapshots.slice(KEEP)) rmSync(old, { recursive: true, force: true });

console.log(`Snapshot: ${target} (${copied} entries, keeping ${Math.min(snapshots.length, KEEP)})`);
