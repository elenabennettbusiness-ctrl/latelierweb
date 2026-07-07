// One-off probe to exercise every branch of getDishImage().
// Run with: node scripts/probe-imageMap.mjs
// (Logs only fire under Vite's dev server because import.meta.env.DEV
//  is a Vite-only construct — Node ESM returns undefined for it.)
import { getDishImage, LOGO_FALLBACK } from '../src/components/restaurant/menu/imageMap.js';
import cats from '../src/components/restaurant/menu/categories.js';

console.log('=== Branch coverage ===');

const r1 = getDishImage('nonexistent-category', { name: 'Test' });
console.log('1. unknown category →', r1);

const r2 = getDishImage('salades', null);
console.log('2. null item         →', r2);

const r3 = getDishImage('boissons', { name: 'Café Expresso' });
console.log('3. INTENTIONAL_LOGO  →', r3 === LOGO_FALLBACK ? 'LOGO_FALLBACK ✓' : r3);

const r4 = getDishImage('boissons', { name: 'Schweppes Citron / Tonic' });
console.log('4. override          →', r4);

const r5 = getDishImage('salades', { name: 'La Niçoise' });
console.log('5. default rule      →', r5);

const r6 = getDishImage('pasta', { name: 'Penne Arrabiatta' });
console.log('6. pasta id≠folder   →', r6);

console.log('\n=== Full coverage ===');
let ok = 0, logo = 0, none = 0;
for (const cat of cats) {
  for (const item of cat.items) {
    const url = getDishImage(cat.id, item);
    if (url === LOGO_FALLBACK) logo++;
    else if (url) ok++;
    else none++;
  }
}
console.log(`  ${ok} files + ${logo} logos + ${none} null = ${ok + logo + none} total`);
console.log(none === 0 ? 'PASS — every item has a defined image path' : 'FAIL — null returns present');
