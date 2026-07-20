import React, { useEffect, useRef } from 'react';
import { MapPin, Phone, Clock, Car } from 'lucide-react';
import { SCHEDULE } from './hours/hoursData';

/* ============================================================
   LocationSection — "Emplacement"

   Two-column location block: the dark-themed map of the Marjane
   roundabout on the left, and the practical details — address,
   phone, hours, parking — plus a directions CTA on the right.
   Stacks to map-then-details on mobile.

   This section owns the restaurant's location and contact
   details; InfoSection below it deliberately no longer repeats
   them and covers amenities instead.
   ============================================================ */

const MAP_IMAGE = '/Map/1.webp';

// The file is 1334x2000 (2:3 portrait). Declared on the <img> to reserve
// the box before decode — the anti-CLS trick hoursData.js documents. The
// frame below uses the same 2:3, so nothing is cropped and the whole map
// is visible.
const MAP_NATURAL = { width: 1334, height: 2000 };

// Reviewed against the actual file: a dark Google-Maps view centred on the
// pin, with the roundabout, Marjane and the Fès–Meknès road around it.
const MAP_ALT =
  "Carte de localisation de L'Atelier Restaurant, près du rond-point Marjane à Oued Fès, sur la route principale Fès–Meknès.";

/* Hours come from hoursData.js, the single source of truth for the
   Horaires section, rather than being restated here — otherwise the two
   sections drift apart the first time the schedule changes. Every day
   currently carries the same slots, so this collapses to one line; if
   that stops being true it falls back to naming the section instead of
   printing something wrong. */
function summariseSchedule(schedule) {
  const open = schedule.filter((d) => d.slots.length > 0);
  if (open.length === 0) return null;
  const first = open[0].slots.join(' & ');
  const uniform = open.length === schedule.length && open.every((d) => d.slots.join(' & ') === first);
  return uniform ? `Tous les jours · ${first}` : 'Voir les horaires détaillés ci-dessus';
}

const DETAILS = [
  {
    icon: MapPin,
    label: 'Adresse',
    lines: ['Rond point Marjane Oued Fès, rocade,', 'Rte Principale Fès Meknès, Fès 30000'],
  },
  {
    icon: Phone,
    label: 'Téléphone',
    href: 'tel:+212535757619',
    lines: ['05 35 75 76 19'],
  },
  {
    icon: Clock,
    label: 'Horaires',
    lines: [summariseSchedule(SCHEDULE)],
  },
  {
    icon: Car,
    label: 'Parking',
    lines: ['Parking gratuit — stationnement facile'],
  },
];

const SECTION_STYLES = `
  /* — Map figure — */
  .loc-figure {
    position: relative;
    /* The frame matches the source's native 2:3, so the map gains height
       without gaining width and object-fit has nothing left to crop — the
       full view is shown. Column widths are untouched. */
    aspect-ratio: 2 / 3;
    border-radius: clamp(24px, 2.2vw, 32px);
    overflow: hidden;
    border: 1px solid rgba(197, 160, 89, 0.14);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .loc-map {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* Hover lift on real pointers only, so it never fires from a tap. */
  @media (hover: hover) and (pointer: fine) {
    .loc-figure:hover .loc-map { transform: scale(1.02); }
  }

  /* — Detail rows — */
  .loc-list { margin-top: 2.5rem; }
  .loc-row-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.125rem;
    color: #EBEBEB;
    line-height: 1.3;
  }

  /* — CTA —
     Same rules as Navigation.jsx's .nav-cta, the site-wide gold button.
     Duplicated rather than imported because .nav-cta lives inside that
     component's own <style> string; this section follows the project's
     per-section style-block convention. */
  .loc-cta-wrap { margin-top: 2.75rem; }
  .loc-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 0.65rem 1.5rem;
    border: 1px solid rgba(197, 160, 89, 0.7);
    color: #C5A059;
    background: transparent;
    cursor: pointer;
    transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .loc-cta:hover,
  .loc-cta:focus-visible {
    background: #C5A059;
    color: #0A0A0A;
    border-color: #C5A059;
    outline: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(197, 160, 89, 0.28);
  }
  @media (max-width: 480px) {
    .loc-cta { width: 100%; }
  }

  /* — Reveal —
     One observer on the grid; children stagger off descendant selectors,
     the same mechanism HoursSection.jsx uses. */
  .loc-figure,
  .loc-head,
  .loc-row,
  .loc-cta-wrap {
    opacity: 0;
    transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .loc-figure { transform: scale(1.01); }
  .loc-head { transform: translate3d(0, 24px, 0); }
  .loc-row { transform: translate3d(0, 20px, 0); }
  .loc-cta-wrap { transform: translate3d(0, 20px, 0); }

  .loc-grid.is-visible .loc-figure,
  .loc-grid.is-visible .loc-head,
  .loc-grid.is-visible .loc-row,
  .loc-grid.is-visible .loc-cta-wrap {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  .loc-grid.is-visible .loc-head { transition-delay: 120ms; }
  .loc-grid.is-visible .loc-row:nth-child(1) { transition-delay: 260ms; }
  .loc-grid.is-visible .loc-row:nth-child(2) { transition-delay: 330ms; }
  .loc-grid.is-visible .loc-row:nth-child(3) { transition-delay: 400ms; }
  .loc-grid.is-visible .loc-row:nth-child(4) { transition-delay: 470ms; }
  .loc-grid.is-visible .loc-cta-wrap { transition-delay: 600ms; }

  @media (prefers-reduced-motion: reduce) {
    .loc-figure,
    .loc-head,
    .loc-row,
    .loc-cta-wrap,
    .loc-map {
      transition: none;
      transition-delay: 0ms;
      opacity: 1;
      transform: none;
    }
    .loc-figure:hover .loc-map { transform: none; }
  }
`;

// Same dependency-free reveal pattern used by ReviewsSection.jsx/HoursSection.jsx.
function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) el.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: options.rootMargin || '0px 0px -10% 0px',
        threshold: options.threshold || 0.12,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}

export default function LocationSection() {
  const gridRef = useReveal({ threshold: 0.08 });

  return (
    <section
      id="emplacement"
      className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden"
      aria-labelledby="emplacement-title"
    >
      <style dangerouslySetInnerHTML={{ __html: SECTION_STYLES }} />

      <div
        ref={gridRef}
        className="loc-grid max-w-6xl mx-auto grid md:grid-cols-[45fr_55fr] gap-10 md:gap-12 lg:gap-16 items-center"
      >
        <figure className="loc-figure">
          <img
            className="loc-map"
            src={MAP_IMAGE}
            width={MAP_NATURAL.width}
            height={MAP_NATURAL.height}
            loading="lazy"
            decoding="async"
            alt={MAP_ALT}
          />
        </figure>

        <div>
          <div className="loc-head">
            <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Emplacement</p>
            <h2
              id="emplacement-title"
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-light italic text-marble mb-4"
            >
              Retrouvez-nous à Fès
            </h2>
            <div className="gold-line w-16" />
            <p className="font-body text-sm text-marble/60 leading-relaxed mt-6 max-w-md">
              À deux pas du rond-point Marjane, sur la route principale Fès–Meknès, L&apos;Atelier
              vous accueille dans un quartier facile d&apos;accès, avec un stationnement gratuit
              devant le restaurant.
            </p>
          </div>

          <ul className="loc-list space-y-6">
            {DETAILS.map(({ icon: Icon, label, href, lines }, i) => (
              <li key={label} className="loc-row">
                {i > 0 && <div className="gold-line w-full mb-6" />}
                <div className="flex items-start gap-4">
                  <Icon size={20} className="text-gold mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="loc-row-label">{label}</h3>
                    {href ? (
                      <a
                        href={href}
                        className="font-body text-sm text-marble/60 hover:text-gold mt-1 block transition-colors"
                      >
                        {lines[0]}
                      </a>
                    ) : (
                      <p className="font-body text-sm text-marble/60 mt-1 leading-relaxed">
                        {lines.map((line, j) => (
                          <React.Fragment key={j}>
                            {line}
                            {j < lines.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="loc-cta-wrap">
            {/* The Google Maps link is prepared but deliberately not wired up
                yet — add the href/onClick when the destination is confirmed. */}
            <button type="button" className="loc-cta">
              Obtenir l&apos;itinéraire
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
