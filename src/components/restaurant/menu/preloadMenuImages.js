/* ============================================================
   preloadMenuImages — warms the browser cache with the mobile
   dish photos before the visitor reaches the Menu section.

   Plain module, not a hook: preloading must not re-render
   anything, and the "already done" set has to survive category
   switches and component remounts.

   Memory note: the Image objects are deliberately NOT retained.
   What removes the visible delay is the *encoded bytes* sitting
   in the HTTP cache — decoding a cached 900x1349 WebP takes
   ~10 ms and happens off the main thread via decoding="async".
   Holding all 57 decoded would be ~277 MB of bitmap (900 x 1349
   x 4 bytes each), which iOS Safari would kill the tab over.
   Letting them stay evictable is the whole point.
   ============================================================ */

// Module-level so a URL is never fetched twice in a session.
const preloaded = new Set();

/** True when the connection is too constrained to justify preloading. */
export function shouldSkipPreload() {
  if (typeof navigator === 'undefined') return true;
  const c = navigator.connection;
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === 'slow-2g' || c.effectiveType === '2g';
}

function loadOne(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    // Keeps preloads behind anything the renderer actually needs.
    if ('fetchPriority' in img) img.fetchPriority = 'low';

    const done = (ok) => {
      if (!ok) preloaded.delete(url); // allow a later retry
      resolve();
    };

    img.onload = () => {
      // decode() resolves once the bitmap is ready, so the image is
      // never handed to the renderer mid-decode.
      if (typeof img.decode === 'function') {
        img.decode().then(() => done(true), () => done(true));
      } else {
        done(true);
      }
    };
    img.onerror = () => done(false);
    img.src = url;
  });
}

/**
 * Fetch and decode `urls` with bounded concurrency.
 * Resolves once everything has been attempted or `signal` aborts.
 */
export function preloadMenuImages(urls, { concurrency = 3, signal } = {}) {
  const queue = [];
  for (const url of urls) {
    if (url && !preloaded.has(url)) {
      preloaded.add(url);
      queue.push(url);
    }
  }
  if (!queue.length) return Promise.resolve();

  let cursor = 0;
  const worker = async () => {
    while (cursor < queue.length) {
      if (signal?.aborted) return;
      const url = queue[cursor];
      cursor += 1;
      await loadOne(url);
      // Yield between images so a long run never monopolises the
      // main thread while the visitor is still scrolling.
      await new Promise((r) => setTimeout(r, 0));
    }
  };

  return Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, worker)
  );
}
