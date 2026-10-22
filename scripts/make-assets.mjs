// Generates the launcher icons and splash screens from one drawing.
// Run with `npm run assets` after changing the artwork. Output is committed.

import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RES = 'android/app/src/main/res';
const GROUND = '#0F1214';
const BRASS = '#D8A34A';

const KNIFE = `
  <g fill="none" stroke="${BRASS}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M3 31h17v12H3a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 3 31z"/>
    <path d="M20 31h30c4.5 0 8.5 1.2 11 3.5-8 5.5-24 8.5-41 8.5z"/>
  </g>
  <g fill="${BRASS}">
    <circle cx="9" cy="37" r="1.4"/>
    <circle cx="15" cy="37" r="1.4"/>
  </g>`;

// Draws the knife into a square of `size`, centred, occupying `share` of it.
function knifeMarkup(size, share) {
  const scale = (size * share) / 64;
  const x = (size - 64 * scale) / 2;
  const y = (size - 64 * scale) / 2;
  return `<g transform="translate(${x} ${y}) scale(${scale})">${KNIFE}</g>`;
}

function iconSvg(size, { round = false } = {}) {
  const radius = round ? size / 2 : size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${GROUND}"/>
    ${knifeMarkup(size, 0.62)}
  </svg>`;
}

function adaptiveSvg(size, { background }) {
  if (background) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${GROUND}"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${knifeMarkup(size, 0.44)}
  </svg>`;
}

function splashSvg(width, height) {
  const size = Math.min(width, height);
  const mark = knifeMarkup(size, 0.24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${GROUND}"/>
    <g transform="translate(${(width - size) / 2} ${(height - size) / 2})">${mark}</g>
  </svg>`;
}

async function render(svg, path) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path);
}

const DENSITIES = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

for (const [density, size] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${density}`);
  await render(iconSvg(size), join(dir, 'ic_launcher.png'));
  await render(iconSvg(size, { round: true }), join(dir, 'ic_launcher_round.png'));
  const adaptive = Math.round((size / 48) * 108);
  await render(adaptiveSvg(adaptive, { background: true }), join(dir, 'ic_launcher_background.png'));
  await render(adaptiveSvg(adaptive, { background: false }), join(dir, 'ic_launcher_foreground.png'));
}

// Splash screens keep whatever sizes the Android project already ships.
const dirs = (await readdir(RES, { withFileTypes: true })).filter(entry => entry.isDirectory());
for (const dir of dirs) {
  if (!dir.name.startsWith('drawable')) continue;
  const files = await readdir(join(RES, dir.name));
  for (const file of files) {
    if (file !== 'splash.png') continue;
    const path = join(RES, dir.name, file);
    const meta = await sharp(await readFile(path)).metadata();
    await render(splashSvg(meta.width, meta.height), path);
  }
}

// The web manifest and browser tab reuse the same mark.
const webIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${GROUND}"/>
  <g fill="none" stroke="${BRASS}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M5 15.5h4v4H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/>
    <path d="M9 15.5h7c1.4 0 2.6.4 3.4 1.1-2.5 1.7-7 2.6-10.4 2.6z"/>
  </g>
</svg>`;
await writeFile('web/icon.svg', webIcon + '\n');

console.log('Launcher icons, splash screens and web icon regenerated.');
