/* ============================================================
   menuData — auto-discovers every category folder and dish
   image under src/assets/NewMenu/ via Vite's import.meta.glob.

   Adding or removing a .webp file in any NewMenu/<Category>/
   folder (or adding a brand-new category folder) requires no
   code change here — the next dev/build pass picks it up.

   Display names are derived from filenames (whitespace
   normalized only — the files on disk are never renamed).
   ============================================================ */

// Eagerly resolved at build time into a plain object of
// { filePath: resolvedUrl }. `eager: true` only affects when the
// module graph is resolved, not when image bytes are fetched —
// actual network loading is controlled entirely by each
// <img loading="lazy|eager"> tag.
const modules = import.meta.glob('/src/assets/NewMenu/*/*.webp', {
  eager: true,
  import: 'default',
});

// Canonical category order per the design spec. Any folder found
// on disk that isn't listed here is appended alphabetically, so
// nothing is ever silently dropped.
const CATEGORY_ORDER = [
  'Boissons',
  'Burgers',
  'Desserts',
  'Grillades',
  'Pasta',
  'Pizzas',
  'Salades',
  'Viandes',
];

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildMenu() {
  const byCategory = new Map();

  for (const [path, url] of Object.entries(modules)) {
    const match = path.match(/\/NewMenu\/([^/]+)\/([^/]+)\.webp$/i);
    if (!match) continue;

    const category = normalizeWhitespace(match[1]);
    const name = normalizeWhitespace(match[2]);

    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push({
      id: `${slugify(category)}--${slugify(name)}`,
      name,
      image: url,
    });
  }

  for (const dishes of byCategory.values()) {
    dishes.sort((a, b) => collator.compare(a.name, b.name));
  }

  const known = CATEGORY_ORDER.filter((name) => byCategory.has(name));
  const extra = [...byCategory.keys()]
    .filter((name) => !CATEGORY_ORDER.includes(name))
    .sort((a, b) => collator.compare(a, b));

  return [...known, ...extra].map((name) => ({
    id: slugify(name),
    name,
    dishes: byCategory.get(name),
  }));
}

export const MENU = buildMenu();
