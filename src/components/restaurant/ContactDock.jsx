import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

/* ============================================================
   ContactDock — the floating contact entry point.

   One discreet glass pill bottom-right. Tapping it fans out two
   actions: WhatsApp (with a pre-filled message) and Instagram.
   It closes on outside click, on Escape, and once an action has
   been opened.

   Deliberately self-contained: it reads no state from the page,
   exports nothing, and owns its own <style> block — mounting it
   in Home.jsx is the entire integration. Nothing else on the site
   is touched.

   Visual language is borrowed rather than invented:
     - the smoked-glass recipe comes from .nav-glass
       (Navigation.jsx) — same blur, saturation and inset hairline;
     - the scroll-reveal threshold is ReservationBar.jsx's;
     - the easing is the house cubic-bezier(0.22, 1, 0.36, 1).

   The brand marks are the official WhatsApp and Instagram glyph
   geometry inlined as SVG. lucide-react ships no WhatsApp icon
   and its Instagram glyph is a generic outline, so inlining is
   the only way to stay instantly recognisable without adding a
   dependency. They sit monochrome at rest and only take their
   brand colour on hover, so the palette stays black-and-gold.

   Only transform and opacity animate. backdrop-filter is static,
   exactly as .nav-glass already uses it.
   ============================================================ */

const WHATSAPP_URL =
  'https://wa.me/212661256940?text=Bonjour%2C%20j%27aimerais%20avoir%20plus%20d%27informations.';
const INSTAGRAM_URL = 'https://www.instagram.com/latelier_restaurant_fes/';

// Same threshold as ReservationBar.jsx — the dock stays out of the
// way while the Hero is on screen, where it would otherwise sit on
// top of the mobile Hero's progress bar.
const REVEAL_RATIO = 0.2;

// Unique so the gradient can never collide with another inline SVG.
const IG_GRADIENT_ID = 'cdock-ig-gradient';

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.99 2.896 9.83 9.83 0 0 1 2.892 6.994c-.003 5.45-4.437 9.885-9.886 9.885m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.49"
      />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <defs>
        {/* Official Instagram brand gradient, revealed on hover only. */}
        <radialGradient id={IG_GRADIENT_ID} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path
        fill="currentColor"
        d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0m0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.8 3.8 0 0 1-.899 1.382 3.74 3.74 0 0 1-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07s-3.586-.015-4.859-.074c-1.171-.061-1.816-.256-2.236-.421a3.7 3.7 0 0 1-1.379-.899 3.64 3.64 0 0 1-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844s.016-3.586.061-4.861c.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.44 1.44 0 0 1 2.88 0"
      />
    </svg>
  );
}

const STYLES = `
  .cdock {
    position: fixed;
    right: calc(1.25rem + env(safe-area-inset-right));
    bottom: calc(1.25rem + env(safe-area-inset-bottom));
    /* Above the page, but deliberately below the full-screen mobile
       menu (z-60) and the reservation modal (z-50). */
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
    /* Hidden until the Hero has been scrolled past. */
    opacity: 0;
    transform: translate3d(0, 12px, 0);
    pointer-events: none;
    transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cdock.is-revealed {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  /* — the smoked-glass recipe, lifted from .nav-glass — */
  .cdock-trigger,
  .cdock-item {
    width: 3.25rem;
    height: 3.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(10, 10, 10, 0.55);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(197, 160, 89, 0.22);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
    color: #EBEBEB;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .cdock-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
  }

  .cdock-item {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.94);
    pointer-events: none;
    transition: opacity 270ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 270ms cubic-bezier(0.22, 1, 0.36, 1),
                color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cdock.is-open .cdock-item {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    pointer-events: auto;
  }
  /* Stagger on the way in only — closing collapses as one piece. */
  .cdock.is-open .cdock-item:last-child { transition-delay: 60ms; }

  /* Hover / touch: a small lift, nothing aggressive. */
  .cdock.is-open .cdock-item:hover,
  .cdock.is-open .cdock-item:focus-visible {
    transform: translate3d(0, -2px, 0) scale(1.04);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
    outline: none;
  }
  .cdock.is-open .cdock-item-wa:hover,
  .cdock.is-open .cdock-item-wa:focus-visible {
    color: #25D366;
    border-color: rgba(37, 211, 102, 0.55);
  }
  .cdock.is-open .cdock-item-ig:hover svg path,
  .cdock.is-open .cdock-item-ig:focus-visible svg path {
    fill: url(#${IG_GRADIENT_ID});
  }
  .cdock.is-open .cdock-item-ig:hover,
  .cdock.is-open .cdock-item-ig:focus-visible {
    border-color: rgba(214, 36, 159, 0.5);
  }

  .cdock-trigger {
    position: relative;
    transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
                border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cdock-trigger:hover,
  .cdock-trigger:focus-visible {
    transform: translate3d(0, -2px, 0) scale(1.04);
    border-color: rgba(197, 160, 89, 0.55);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
    outline: none;
  }
  .cdock-trigger svg { color: #C5A059; }

  /* The two trigger glyphs are stacked and cross-faded so the
     button never changes size mid-swap. */
  .cdock-trigger-icon {
    position: absolute;
    display: flex;
    transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
                transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cdock-trigger-icon.is-hidden {
    opacity: 0;
    transform: scale(0.7);
  }

  @media (prefers-reduced-motion: reduce) {
    .cdock,
    .cdock-item,
    .cdock-trigger,
    .cdock-trigger-icon {
      transition-property: opacity;
      transition-duration: 200ms;
      transform: none !important;
    }
    .cdock.is-open .cdock-item { transition-delay: 0ms; }
  }
`;

export default function ContactDock() {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const firstActionRef = useRef(null);
  // Only pull focus into the dock when it was opened from the
  // keyboard — doing it on a tap would summon the mobile caret.
  const viaKeyboardRef = useRef(false);

  // Same reveal rule as ReservationBar.jsx.
  useEffect(() => {
    const onScroll = () => {
      setRevealed(window.scrollY > window.innerHeight * REVEAL_RATIO);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // A dock that scrolls out of its reveal window should not stay open.
  useEffect(() => {
    if (!revealed && open) setOpen(false);
  }, [revealed, open]);

  // Outside click + Escape, wired only while open. pointerdown covers
  // mouse and touch in one listener without double-firing.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close({ restoreFocus: true });
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    if (viaKeyboardRef.current) firstActionRef.current?.focus();

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const toggle = (e) => {
    // detail === 0 means the click came from Enter/Space, not a pointer.
    viaKeyboardRef.current = e.detail === 0;
    setOpen((v) => !v);
  };

  const actionTabIndex = open ? 0 : -1;

  return (
    <>
      <style>{STYLES}</style>

      <div
        ref={rootRef}
        className={`cdock${revealed ? ' is-revealed' : ''}${open ? ' is-open' : ''}`}
      >
        <div className="cdock-actions" id="cdock-actions" aria-hidden={!open}>
          <a
            ref={firstActionRef}
            className="cdock-item cdock-item-wa"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nous écrire sur WhatsApp"
            tabIndex={actionTabIndex}
            onClick={() => close()}
          >
            <WhatsAppMark />
          </a>
          <a
            className="cdock-item cdock-item-ig"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir notre Instagram"
            tabIndex={actionTabIndex}
            onClick={() => close()}
          >
            <InstagramMark />
          </a>
        </div>

        <button
          ref={triggerRef}
          type="button"
          className="cdock-trigger"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="cdock-actions"
          aria-haspopup="true"
          aria-label={open ? 'Fermer le menu de contact' : 'Nous contacter'}
          tabIndex={revealed ? 0 : -1}
        >
          <span className={`cdock-trigger-icon${open ? ' is-hidden' : ''}`}>
            <MessageCircle size={22} strokeWidth={1.5} />
          </span>
          <span className={`cdock-trigger-icon${open ? '' : ' is-hidden'}`}>
            <X size={22} strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </>
  );
}
