import React, { useEffect, useRef } from 'react';
import { Globe, Instagram, MapPin, Phone } from 'lucide-react';

/* ============================================================
   Footer — the site's closing scene.

   Composition is built around the logo: a short presentation on
   the left, the wordmark large and centred, contact details on
   the right, separated by two hairline verticals. Everything is
   arranged so the logo is the only thing shouting.

   The background stack (photo + overlay + vignette) is unchanged
   from the previous pass and deliberately untouched: the photo
   renders unfiltered at its true colours, and the overlay sits at
   the measured floor for legible text.
   ============================================================ */

const FOOTER_BG = '/i1/footer-bg.webp';

const MAPS_URL =
  'https://www.google.com/maps/place/L%E2%80%99atelier+Restaurant/@34.0479463,-5.0378838,17z';

const LOGO_URL =
  'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png';

// Every value is real data already used elsewhere on the site. An email row
// belongs here by design, but no address exists anywhere in the codebase — add
// `{ icon: Mail, label: 'Email', value: '…', href: 'mailto:…' }` once there is a
// real one. A plausible-looking invention would send customers into a void.
const CONTACT = [
  { icon: MapPin, label: 'Adresse', value: 'Rond-point Marjane, Fès', href: MAPS_URL, external: true },
  { icon: Phone, label: 'Téléphone', value: '05 35 75 76 19', href: 'tel:+212535757619' },
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@latelier_restaurant_fes',
    href: 'https://instagram.com/latelier_restaurant_fes',
    external: true,
  },
  { icon: Globe, label: 'Site Web', value: 'latelierrestaurant.ma', href: 'https://latelierrestaurant.ma', external: true },
];

const FOOTER_STYLES = `
  .ftr-bg-photo {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    /* No filter, deliberately. Do not reintroduce filter/image-rendering here —
       an earlier version blurred and desaturated this layer, and that (not the
       WebP encode) was what made the backdrop look soft and colour-shifted. */
  }
  .ftr-bg-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    /* Measured floor, not a taste call: below 0.70 the body text drops under
       WCAG AA against this photograph's white highlights. */
    background: linear-gradient(180deg, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.77) 100%);
  }
  .ftr-bg-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(120% 100% at 50% 30%, transparent 35%, rgba(10, 10, 10, 0.55) 100%);
  }

  /* — Composition —
     DOM order is the mobile order the brief asks for (logo, about, contact);
     desktop places the three explicitly on the grid, so the reading order stays
     correct for screen readers at every width without order/flex hacks. */
  .ftr-grid {
    --ftr-gap: clamp(2.5rem, 6vw, 6rem);
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 4rem;
  }

  @media (min-width: 768px) {
    .ftr-grid {
      grid-template-columns: 1fr auto 1fr;
      column-gap: var(--ftr-gap);
      /* start, not center: it aligns the two gold headings on one line, which
         reads as composed rather than accidental. The logo still centres
         vertically — its wrapper stretches and flex-centres the mark inside. */
      align-items: start;
      text-align: left;
    }
    /* The blocks face the logo rather than the section edges, so the whitespace
       around the mark is exactly the column gap on both sides. Pinning them to
       the outer edges flung them to the extremes and left a void around the
       logo; centring them in their columns left the two gutters unequal (89px
       vs 143px) because the blocks aren't the same width. */
    .ftr-about       { grid-column: 1; grid-row: 1; justify-self: end; }
    .ftr-logo-wrap   { grid-column: 2; grid-row: 1; align-self: stretch; }
    .ftr-contact-col { grid-column: 3; grid-row: 1; justify-self: start; }
  }

  /* — Logo: the hero —
     Sized by height with width:auto, so the 1024x683 wordmark keeps its exact
     proportions — never stretched, never cropped. ~3x its previous 56px. */
  .ftr-logo-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 clamp(1rem, 3vw, 2.5rem);
  }
  .ftr-logo {
    display: block;
    /* Height-driven with width:auto — the 1024x683 mark keeps its exact 3:2
       proportions at every size. ~3x its previous 56px, so it leads the section. */
    height: clamp(6.5rem, 12vw, 12rem);
    width: auto;
    max-width: 100%;
  }

  /* — Dividers —
     Hairlines that fade out at both ends rather than hard borders, echoing the
     site's .gold-line. Only where there is something to divide: on mobile the
     columns stack and the rules would be meaningless, so they are desktop-only. */
  @media (min-width: 768px) {
    .ftr-logo-wrap::before,
    .ftr-logo-wrap::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 72%;
      /* 0.38, not 0.22: these sit over an unfiltered, brightly-lit photograph
         rather than flat obsidian, and at 0.22 they were simply invisible. Still
         a hairline that fades to nothing at both ends — never a hard border. */
      background: linear-gradient(180deg, transparent 0%, rgba(197, 160, 89, 0.38) 50%, transparent 100%);
    }
    .ftr-logo-wrap::before { left: calc(var(--ftr-gap) / -2); }
    .ftr-logo-wrap::after  { right: calc(var(--ftr-gap) / -2); }
  }

  /* — Left: presentation — */
  .ftr-about__text {
    max-width: 300px;
    color: rgba(235, 235, 235, 0.7);
    line-height: 1.85;
  }
  .ftr-copy {
    /* 0.7, not 0.6. background-size cover crops the photo, so a narrow viewport
       shows a brighter part of it than a wide one — at 0.6 this line measured
       4.32:1 on mobile (under AA) while passing everywhere else. Contrast has to
       hold at the worst breakpoint, not the one that happens to be measured. */
    color: rgba(235, 235, 235, 0.7);
  }

  /* — Right: contact — */
  .ftr-contact {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                text-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ftr-contact__icon {
    flex-shrink: 0;
    margin-top: 0.9rem;
    color: #C5A059;
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ftr-contact__label {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 0.625rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #C5A059;
    margin-bottom: 0.35rem;
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ftr-contact__value {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    color: rgba(235, 235, 235, 0.82);
    transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ftr-contact:hover,
  .ftr-contact:focus-visible { outline: none; }
  .ftr-contact:hover .ftr-contact__icon,
  .ftr-contact:focus-visible .ftr-contact__icon,
  .ftr-contact:hover .ftr-contact__label,
  .ftr-contact:focus-visible .ftr-contact__label {
    color: #FF6B6B;
  }
  .ftr-contact:hover .ftr-contact__value,
  .ftr-contact:focus-visible .ftr-contact__value {
    color: #FF6B6B;
    text-shadow: 0 0 8px rgba(255, 107, 107, 0.4), 0 0 18px rgba(255, 107, 107, 0.22);
  }

  /* — Reveal —
     Fade + a slight rise for the side blocks; the logo only fades, a touch
     slower, so it settles rather than moves. No scale, no bounce. */
  .ftr-reveal .ftr-about,
  .ftr-reveal .ftr-contact-col {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
    transition: opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }
  .ftr-reveal .ftr-logo-wrap {
    opacity: 0;
    transition: opacity 1100ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity;
  }
  .ftr-reveal.is-visible .ftr-about,
  .ftr-reveal.is-visible .ftr-contact-col {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  .ftr-reveal.is-visible .ftr-logo-wrap { opacity: 1; }
  .ftr-reveal.is-visible .ftr-about { transition-delay: 150ms; }
  .ftr-reveal.is-visible .ftr-contact-col { transition-delay: 260ms; }

  @media (prefers-reduced-motion: reduce) {
    .ftr-reveal .ftr-about,
    .ftr-reveal .ftr-contact-col,
    .ftr-reveal .ftr-logo-wrap {
      transition: none;
      transition-delay: 0ms;
      opacity: 1;
      transform: none;
    }
    .ftr-contact, .ftr-contact__icon, .ftr-contact__label, .ftr-contact__value {
      transition: none;
    }
  }
`;

// Same dependency-free reveal pattern used by AboutSection.jsx /
// MenuSection.jsx / ReviewsSection.jsx / HoursSection.jsx.
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

export default function Footer() {
  const revealRef = useReveal({ rootMargin: '0px 0px -5% 0px' });

  return (
    <footer className="relative py-20 md:py-32 px-6 md:px-12 border-t border-gold/10 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <div
        className="ftr-bg-photo"
        style={{ backgroundImage: `url(${FOOTER_BG})` }}
        aria-hidden="true"
      />
      <div className="ftr-bg-overlay" aria-hidden="true" />
      <div className="ftr-bg-vignette" aria-hidden="true" />

      <div ref={revealRef} className="ftr-reveal max-w-6xl mx-auto relative z-10">
        <div className="ftr-grid">
          {/* Logo — first in the DOM so it leads on mobile, placed centre on desktop */}
          <div className="ftr-logo-wrap">
            <img
              src={LOGO_URL}
              alt="L'Atelier Restaurant"
              width="1024"
              height="683"
              className="ftr-logo"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>

          {/* Left — presentation */}
          <div className="ftr-about">
            <h4 className="font-heading text-lg text-gold mb-5">À Propos</h4>
            <p className="ftr-about__text font-body text-sm mx-auto md:mx-0">
              Une expérience gastronomique où le patrimoine de Fès rencontre la précision de
              l&apos;art culinaire méditerranéen.
            </p>
            <p className="ftr-copy font-body text-[11px] tracking-wider mt-8">
              © {new Date().getFullYear()} L&apos;Atelier Restaurant Fès.
              <br />
              Tous droits réservés.
            </p>
          </div>

          {/* Right — contact */}
          <div className="ftr-contact-col">
            <h4 className="font-heading text-lg text-gold mb-6">Contact</h4>
            {/* inline-block + text-left: centring each row individually would start
                every icon at a different x, leaving a ragged gold edge on mobile.
                This centres the block as a unit while the icons stay in one column. */}
            <ul className="inline-block text-left space-y-5">
              {CONTACT.map(({ icon: Icon, label, value, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="ftr-contact"
                  >
                    <Icon size={16} className="ftr-contact__icon" aria-hidden="true" />
                    <span>
                      <span className="ftr-contact__label">{label}</span>
                      <span className="ftr-contact__value">{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
