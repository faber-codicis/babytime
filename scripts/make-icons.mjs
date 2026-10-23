// Generates PWA icons from src/assets/logo.svg into public/. Run: npm run icons
import { copyFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROSE = '#B04A63';
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = join(projectDir, 'src', 'assets', 'logo.svg');
const publicDir = join(projectDir, 'public');

const logo = readFileSync(logoPath, 'utf8');
// The motif is everything inside the logo except the rounded background rect.
const motif = logo
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<rect[^>]*\/>/, '');

/** Square full-bleed background with the motif scaled around the centre. */
const fullBleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${ROSE}"/>
  <g transform="translate(100 100) scale(${scale}) translate(-100 -100)">${motif}</g>
</svg>`;

const render = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 72 * Math.ceil(size / 200) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, file));

await Promise.all([
  render(logo, 192, 'icon-192.png'),
  render(logo, 512, 'icon-512.png'),
  // Maskable: background fills the whole square, motif at 80 % for the safe zone.
  render(fullBleed(0.8), 512, 'icon-512-maskable.png'),
  // iOS rounds the corners itself, so no transparent corners here.
  render(fullBleed(1), 180, 'apple-touch-icon.png'),
]);
copyFileSync(logoPath, join(publicDir, 'favicon.svg'));

console.log('Icons written to public/');
