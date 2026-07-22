import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X, Menu, Home, Sparkles, Image, BookOpen, UtensilsCrossed,
  Star, Clock, MapPin, Phone, CalendarDays,
} from 'lucide-react';
import { openReservation } from './ReservationModal';

const navItems = [
  { id: 'hero', label: 'Accueil' },
  { id: 'about', label: 'Notre Histoire' },
  { id: 'menu', label: 'La Carte' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'reviews', label: 'Avis' },
  { id: 'info', label: 'Infos' },
];

/* Mobile drawer only — `navItems` above stays the desktop bar's list.

   The drawer has the room to reach three sections the header cannot fit
   (#welcome, #horaires, #emplacement), so it doubles as the site index.
   The grouping is not decoration: it splits the page by what a visitor is
   actually asking — who you are, what you serve, how to visit. */
const mobileNavGroups = [
  {
    eyebrow: 'La Maison',
    items: [
      { id: 'hero', label: 'Accueil', Icon: Home },
      { id: 'welcome', label: 'Bienvenue', Icon: Sparkles },
      { id: 'about', label: 'Notre Histoire', Icon: BookOpen },
      { id: 'gallery', label: 'Galerie', Icon: Image },
    ],
  },
  {
    eyebrow: 'La Table',
    items: [
      { id: 'menu', label: 'Notre Menu', Icon: UtensilsCrossed },
      { id: 'reviews', label: 'Avis Clients', Icon: Star },
    ],
  },
  {
    eyebrow: 'Informations',
    items: [
      { id: 'horaires', label: 'Horaires', Icon: Clock },
      { id: 'emplacement', label: 'Emplacement', Icon: MapPin },
      { id: 'info', label: 'Contact', Icon: Phone },
    ],
  },
];

const MOBILE_NAV_IDS = mobileNavGroups.flatMap((g) => g.items.map((i) => i.id));

// The house curve, already used by every transition in this file.
const EASE = [0.22, 1, 0.36, 1];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState('hero');
  const reduced = useReducedMotion();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const scrimRef = useRef(null);
  const rowRefs = useRef({});
  const [ribbon, setRibbon] = useState({ y: 0, ready: false });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Scroll-spy for the gold ribbon. Mounted only while the drawer is
     open, so it costs nothing the rest of the time. The -45%/-45% inset
     leaves a thin band across the middle of the viewport: whichever
     section crosses it is the one you are actually looking at. */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const els = MOBILE_NAV_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActiveId(hit.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mobileOpen]);

  /* Position the ribbon on the active row.

     Deliberately measured rather than done with framer's `layoutId`: a
     layoutId element inside AnimatePresence keeps its layout projection
     alive, and the drawer's exit animation then completes visually but
     never unmounts. offsetTop is layout, not transform, so it is correct
     even while the rows are still animating in. */
  useEffect(() => {
    const el = mobileOpen ? rowRefs.current[activeId] : null;
    if (!el) { setRibbon((r) => ({ ...r, ready: false })); return; }
    setRibbon({ y: el.offsetTop + el.offsetHeight / 2 - 11, ready: true });
  }, [mobileOpen, activeId]);

  /* Focus management. Focus enters on the close button, Escape closes,
     Tab cycles inside the panel, and focus returns to whatever opened
     the drawer (the hamburger) on unmount. */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const opener = document.activeElement;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e) => {
      if (e.key === 'Escape') { setMobileOpen(false); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [mobileOpen]);

  /* Background scroll. The panel's own list uses overscroll-behavior to
     stop chaining at its ends; the scrim has nothing to scroll, so a drag
     there is simply cancelled. Deliberately NOT the global window-level
     blocker LoadingScreen.jsx uses — that would also kill the panel's
     momentum scrolling. */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const el = scrimRef.current;
    if (!el) return undefined;
    const block = (e) => e.preventDefault();
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, [mobileOpen]);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Reduced motion keeps every state change, drops only the travel.
  const panelV = reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.16 } } }
    : { hidden: { opacity: 0, x: '100%' },
        show: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE } },
        exit: { opacity: 0, x: '100%', transition: { duration: 0.26, ease: EASE } } };

  const listV = reduced
    ? { hidden: {}, show: {} }
    : { hidden: {}, show: { transition: { delayChildren: 0.12, staggerChildren: 0.03 } } };

  const rowV = reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } } };

  return (
    <>
      <style>{`
        .nav-glass {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          opacity: 0;
          transform: translateY(-16px);
          pointer-events: none;
          background-color: rgba(10, 10, 10, 0.15);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
          transition: opacity 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      backdrop-filter 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      -webkit-backdrop-filter 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-glass.is-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .nav-glass.is-scrolled {
          background-color: rgba(10, 10, 10, 0.45);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
        }
        .nav-link {
          position: relative;
          color: rgba(235, 235, 235, 0.92);
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.78rem;
          padding: 0.5rem 0.1rem;
          transition: color 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0.15rem;
          height: 1px;
          background: #C5A059;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-link:hover,
        .nav-link:focus-visible {
          color: #C5A059;
          outline: none;
        }
        .nav-link:hover::after,
        .nav-link:focus-visible::after {
          transform: scaleX(0.7);
        }
        .nav-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 0.65rem 1.5rem;
          border: 1px solid rgba(197, 160, 89, 0.7);
          border-radius: var(--btn-radius);
          color: #C5A059;
          background: transparent;
          transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-cta:hover,
        .nav-cta:focus-visible {
          background: #C5A059;
          color: #0A0A0A;
          border-color: #C5A059;
          outline: none;
        }

        /* ===== Mobile drawer (.mnav-*) =====================================
           Namespaced away from the desktop rules above, and only ever
           mounted behind mobileOpen, whose trigger is md:hidden. Nothing
           here can reach the desktop header. */
        .mnav-scrim {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(6, 6, 6, 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .mnav-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 61;
          width: min(88vw, 380px);
          display: flex;
          flex-direction: column;
          background: #0A0A0A;
          border-left: 1px solid rgba(197, 160, 89, 0.14);
          padding-right: env(safe-area-inset-right);
        }
        .mnav-head {
          flex: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: calc(1.15rem + env(safe-area-inset-top)) 1.5rem 1.15rem;
        }
        .mnav-logo { height: 2.15rem; width: auto; }
        .mnav-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin-right: -0.7rem;
          color: rgba(235, 235, 235, 0.7);
          -webkit-tap-highlight-color: transparent;
          transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mnav-close:hover,
        .mnav-close:focus-visible { color: #C5A059; outline: none; }

        .mnav-list {
          position: relative; /* containing block for the ribbon */
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          /* Stops the page behind from taking over at the list's ends
             without blocking the list's own momentum scrolling. */
          overscroll-behavior: contain;
          padding: 0 1.5rem 0.5rem;
        }
        .mnav-eyebrow {
          margin: 1.45rem 0 0.55rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(235, 235, 235, 0.38);
        }
        .mnav-list > .mnav-eyebrow:first-child { margin-top: 0.35rem; }
        /* Same hairline gradient as .gold-line in index.css. */
        .mnav-sep {
          height: 0.5px;
          margin: 1.35rem 0 0;
          background: linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.45), transparent);
        }
        .mnav-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.95rem;
          width: 100%;
          min-height: 52px;
          padding: 0.5rem 0.75rem 0.5rem 1rem;
          border-radius: var(--btn-radius);
          color: #EBEBEB;
          text-align: left;
          -webkit-tap-highlight-color: transparent;
          transition: background-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mnav-row:active { background: rgba(197, 160, 89, 0.08); }
        .mnav-row:focus-visible {
          outline: none;
          background: rgba(197, 160, 89, 0.10);
        }
        .mnav-icon {
          flex: none;
          color: rgba(235, 235, 235, 0.5);
          transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mnav-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 400;
          letter-spacing: 0.01em;
          line-height: 1.2;
        }
        .mnav-row.is-active { color: #C5A059; }
        .mnav-row.is-active .mnav-icon { color: #C5A059; }
        /* The signature: the desktop nav-link underline, stood on end.
           left matches .mnav-list's 1.5rem padding, so it sits exactly on
           the active row's leading edge. */
        .mnav-ribbon {
          position: absolute;
          left: 1.5rem;
          top: 0;
          width: 2px;
          height: 22px;
          border-radius: 1px;
          background: #C5A059;
          pointer-events: none;
        }

        .mnav-foot {
          flex: none;
          padding: 1rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
        }
        .mnav-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          padding: 0.95rem 1.5rem;
          border: 1px solid rgba(197, 160, 89, 0.7);
          border-radius: var(--btn-radius);
          color: #C5A059;
          background: transparent;
          -webkit-tap-highlight-color: transparent;
          transition: background-color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      color 300ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 300ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mnav-cta:active,
        .mnav-cta:focus-visible {
          background: #C5A059;
          color: #0A0A0A;
          border-color: #C5A059;
          outline: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-glass, .nav-link, .nav-link::after, .nav-cta { transition: none; }
          .mnav-row, .mnav-icon, .mnav-close, .mnav-cta { transition: none; }
        }
      `}</style>

      <nav className={`nav-glass ${scrolled ? 'is-visible' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="mx-auto max-w-[1300px] px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollTo('hero')}
            className="flex items-center"
            aria-label="L'Atelier — Accueil"
          >
            <img
              src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
              alt="L'Atelier"
              className="h-9 w-auto"
            />
          </button>

          {/* Desktop links — centered */}
          <div className="hidden md:flex items-center gap-10 lg:gap-14 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="nav-link font-body"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Reserve CTA */}
          <div className="hidden md:flex items-center">
            <button
              onClick={openReservation}
              className="nav-cta"
            >
              Réserver
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-marble"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer — right-edge panel over a dimmed scrim. */}
      {/* Two separate conditionals, each a keyed direct child: AnimatePresence
          tracks exits per child, and a Fragment wrapper hides them from it —
          the panel would then never unmount. */}
      <AnimatePresence>
        {mobileOpen && (
            <motion.div
              key="mnav-scrim"
              ref={scrimRef}
              className="mnav-scrim"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.26, ease: EASE } }}
            />
        )}
        {mobileOpen && (
            <motion.aside
              key="mnav-panel"
              ref={panelRef}
              id="mobile-nav-panel"
              className="mnav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navigation"
              variants={panelV}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="mnav-head">
                <img
                  src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
                  alt="L'Atelier"
                  className="mnav-logo"
                />
                <button
                  ref={closeRef}
                  className="mnav-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Fragments keep every row a direct motion child of the list,
                  so one stagger drives the whole sequence. */}
              <motion.nav
                className="mnav-list"
                variants={listV}
                initial="hidden"
                animate="show"
              >
                {/* An `animate` object rather than a variant label keeps the
                    ribbon out of the stagger sequence. */}
                <motion.span
                  className="mnav-ribbon"
                  aria-hidden="true"
                  initial={false}
                  animate={{ y: ribbon.y, opacity: ribbon.ready ? 1 : 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.34, ease: EASE }}
                />
                {mobileNavGroups.map((group, gi) => (
                  <React.Fragment key={group.eyebrow}>
                    {gi > 0 && <motion.div className="mnav-sep" variants={rowV} />}
                    <motion.p className="mnav-eyebrow" variants={rowV}>
                      {group.eyebrow}
                    </motion.p>
                    {group.items.map(({ id, label, Icon }) => {
                      const isActive = activeId === id;
                      return (
                        <motion.button
                          key={id}
                          variants={rowV}
                          whileTap={reduced ? undefined : { scale: 0.98 }}
                          transition={{ duration: 0.18, ease: EASE }}
                          ref={(el) => { rowRefs.current[id] = el; }}
                          className={`mnav-row${isActive ? ' is-active' : ''}`}
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => scrollTo(id)}
                        >
                          <Icon
                            className="mnav-icon"
                            size={18}
                            strokeWidth={isActive ? 1.75 : 1.5}
                            aria-hidden="true"
                          />
                          <span className="mnav-label">{label}</span>
                        </motion.button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </motion.nav>

              <motion.div
                className="mnav-foot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.26, ease: EASE } }}
              >
                <button
                  className="mnav-cta"
                  onClick={() => {
                    setMobileOpen(false);
                    openReservation();
                  }}
                >
                  <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                  Réserver une table
                </button>
              </motion.div>
            </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
