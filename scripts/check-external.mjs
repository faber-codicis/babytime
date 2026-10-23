// Fails if any built file in dist/ references an external URL (spec 13.3).
// XML namespace URIs are allowed because they are identifiers, not requests.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml']);
const ALLOWED = [
  /^https?:\/\/www\.w3\.org\//,
  /^http:\/\/www\.w3\.org\/2000\/svg$/,
  /^http:\/\/www\.w3\.org\/1999\/xlink$/,
  /^http:\/\/www\.w3\.org\/1999\/xhtml$/,
  /^http:\/\/www\.w3\.org\/1998\/Math\/MathML$/,
  // Text inside Workbox and Dexie error messages, never requested (see DECISIONS.md).
  /^https:\/\/bit\.ly\/wb-precache$/,
  /^https:\/\/tinyurl\.com\/y2uuvskb$/,
  /^http:\/\/bit\.ly\/2kdckMn$/,
];
const URL_RE = /\b(?:https?:|wss?:)\/\/[^\s"'`)<>\\]+/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

let files;
try {
  files = walk(distDir);
} catch {
  console.error('dist/ fehlt – zuerst "npm run build" ausführen.');
  process.exit(1);
}

const findings = [];
for (const file of files) {
  if (!TEXT_EXT.has(extname(file))) continue;
  const content = readFileSync(file, 'utf8');
  for (const [url] of content.matchAll(URL_RE)) {
    if (!ALLOWED.some((re) => re.test(url))) findings.push(`${relative(distDir, file)}: ${url}`);
  }
}

if (findings.length) {
  console.error(`Externe URLs in dist/ gefunden (${findings.length}):`);
  for (const f of [...new Set(findings)]) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`check:external ok – ${files.length} Dateien geprüft, keine externen URLs.`);
