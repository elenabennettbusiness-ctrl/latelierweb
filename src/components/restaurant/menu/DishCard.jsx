import React from 'react';

/* ============================================================
   DishCard — presentational only: image + dish name.
   No price, no button. Styling lives in DishCarousel.jsx's
   shared <style> block (cards are rendered exclusively inside
   the carousel track).

   `ariaHidden` is used for clone copies rendered by the carousel
   for its seamless infinite-loop illusion — the real (visible)
   copy carries the accessible name, clones are hidden from
   assistive tech so dish names aren't announced multiple times.
   ============================================================ */

export default function DishCard({ dish, index = 0, eager = false, ariaHidden = false }) {
  return (
    <div
      className="carte-card"
      style={{ '--i': index }}
      role={ariaHidden ? undefined : 'group'}
      aria-label={ariaHidden ? undefined : dish.name}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      <figure className="carte-card__figure">
        <img
          src={dish.image}
          alt={ariaHidden ? '' : dish.name}
          width="1334"
          height="2000"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          className="carte-card__img"
        />
      </figure>
      <p className="carte-card__name" aria-hidden={ariaHidden ? 'true' : undefined}>
        {dish.name}
      </p>
    </div>
  );
}
