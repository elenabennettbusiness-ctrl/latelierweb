#!/usr/bin/env node
/* ============================================================
   build-menu-mobile-images — generates the mobile derivatives
   of every dish photo.

   The originals in src/assets/NewMenu/ are 1334x2000 and average
   2.59 MB (147.8 MB across 57 files). On a 390px phone the card
   figure renders at ~301 CSS px wide, so those files are ~2.2x
   oversampled at DPR 2 and roughly 15x heavier than they need to
   be. That is what makes the Menu section pop in, and what makes
   preloading the whole section impossible at the original size.

   Output keeps the exact 2:3 aspect ratio (900x1350), so the
   <img> width/height attributes and the figure's aspect-ratio
   still agree and nothing shifts.

   Desktop never loads these — DishCard picks them with a
   media="(max-width: 1024px)" <source>.

   Run: npm run images:menu
   ============================================================ */

import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'src/assets/NewMenu');
const OUT_DIR = path.join(ROOT, 'src/assets/NewMenu-mobile');

const WIDTH = 900; // -> 900x1350, covers DPR 3 on a ~301px-wide card
/* q84 rather than the more usual q78: the busiest photos (grill
   textures, seafood pizza) drop to ~31 dB PSNR at 78, which is
   visible on a premium food shot. 84 costs ~1.4 MB across the whole
   set and lifts the worst case above the no-perceptible-difference
   line. Still ~23x smaller than the originals. */
const QUALITY = 84;

const mb = (n) => `${(n / 1e6).toFixed(2)} MB`;

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const categories = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let srcTotal = 0;
  let outTotal = 0;
  let written = 0;
  let skipped = 0;

  for (const category of categories) {
    const srcCat = path.join(SRC_DIR, category);
    const outCat = path.join(OUT_DIR, category);
    await mkdir(outCat, { recursive: true });

    const files = (await readdir(srcCat)).filter((f) => /\.webp$/i.test(f));
    let catSrc = 0;
    let catOut = 0;

    for (const file of files) {
      const srcPath = path.join(srcCat, file);
      const outPath = path.join(outCat, file);
      const srcStat = await stat(srcPath);
      catSrc += srcStat.size;
      srcTotal += srcStat.size;

      // Re-runs are cheap: only rebuild when the source is newer.
      let fresh = false;
      if (existsSync(outPath)) {
        const outStat = await stat(outPath);
        fresh = outStat.mtimeMs >= srcStat.mtimeMs;
      }

      if (fresh) {
        skipped += 1;
        catOut += (await stat(outPath)).size;
        outTotal += (await stat(outPath)).size;
        continue;
      }

      const buf = await sharp(srcPath)
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      await writeFile(outPath, buf);
      written += 1;
      catOut += buf.length;
      outTotal += buf.length;
    }

    console.log(
      `  ${category.padEnd(12)} ${String(files.length).padStart(2)} files  ` +
        `${mb(catSrc).padStart(9)} -> ${mb(catOut).padStart(9)}`
    );
  }

  const count = written + skipped;
  console.log(
    `\n${count} images  ${mb(srcTotal)} -> ${mb(outTotal)}  ` +
      `(${(srcTotal / outTotal).toFixed(1)}x smaller)  ` +
      `[${written} written, ${skipped} up to date]`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
