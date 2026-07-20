import React, { useEffect, useRef } from 'react';

/* ============================================================
   RawReviewCard — renders a pre-authored review-card HTML
   snippet (from src/assets/Reviews Code/) completely untouched.

   Each snippet is a full standalone document (its own <style> +
   <div class="review-card">...</div> + a read-more <script>) that
   all six files author with the SAME class names and element ids.
   Rendering them directly on the page - especially tripled for
   the infinite-loop carousel - would let one card's CSS leak onto
   another's identically-named classes, and getElementById would
   only ever find the first #readMoreBtn on the whole page.

   Shadow DOM solves both problems with zero rewriting: each card
   gets its own encapsulated style/id scope, so the exact provided
   markup can be dropped in via `shadowRoot.innerHTML = html`
   verbatim. The file's outer <!DOCTYPE>/<html>/<head>/<body> tags
   and its `html, body { ... }` preview-centering rule are inert
   inside a shadow root (there's no real <html>/<body> in there for
   that selector to match), so nothing needs stripping.

   <script> tags inserted via innerHTML never execute (a browser
   platform rule, not a design choice) - the read-more expand/
   collapse logic is reattached here with the identical behavior
   as each file's own inline script, just using
   shadowRoot.getElementById instead of document.getElementById.

   The 640x460 authored card is uniformly scaled (never upscaled)
   to fit whatever slot width the carousel gives it, via a plain
   CSS transform on a wrapper - the only concession needed to fit
   a fixed-size "shareable card" into a responsive carousel slot,
   without touching a single property inside the card's own CSS.
   ============================================================ */

const CARD_WIDTH = 640;
const CARD_HEIGHT = 460;

export default function RawReviewCard({ html, slotWidth = CARD_WIDTH, index = 0, ariaHidden = false }) {
  const hostRef = useRef(null);
  const shadowRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: 'open' });
    }
    const shadow = shadowRef.current;
    shadow.innerHTML = html;

    const textEl = shadow.getElementById('reviewText');
    const btn = shadow.getElementById('readMoreBtn');
    if (!textEl || !btn) return undefined;

    const checkClamp = () => {
      const isClamped = textEl.scrollHeight > textEl.clientHeight + 1;
      if (!isClamped) btn.classList.add('hidden');
    };
    const onClick = () => {
      textEl.classList.add('expanded');
      btn.classList.add('hidden');
    };

    btn.addEventListener('click', onClick);
    const raf = requestAnimationFrame(checkClamp);

    return () => {
      btn.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
    };
  }, [html]);

  const scale = Math.min(1, slotWidth / CARD_WIDTH);

  return (
    <div
      className="avis-raw-slot"
      style={{
        '--i': index,
        position: 'relative',
        overflow: 'hidden',
        width: `${slotWidth}px`,
        height: `${CARD_HEIGHT * scale}px`,
      }}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      <div
        ref={hostRef}
        className="avis-raw-host"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
