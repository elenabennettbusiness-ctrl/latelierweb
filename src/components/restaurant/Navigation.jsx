import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { openReservation } from './ReservationModal';

const navItems = [
  { id: 'hero', label: 'Accueil' },
  { id: 'about', label: 'Notre Histoire' },
  { id: 'menu', label: 'La Carte' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'reviews', label: 'Avis' },
  { id: 'info', label: 'Infos' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

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
        @media (prefers-reduced-motion: reduce) {
          .nav-glass, .nav-link, .nav-link::after, .nav-cta { transition: none; }
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
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile menu — unchanged from the existing implementation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-obsidian/98 flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-6 right-6 text-marble"
              onClick={() => setMobileOpen(false)}
            >
              <X size={28} />
            </button>
            <img
              src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
              alt="L'Atelier"
              className="h-14 w-auto mb-8"
            />
            {navItems.map((item, i) => (
              <motion.button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="font-heading text-3xl font-light italic text-marble hover:text-gold transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {item.label}
              </motion.button>
            ))}
            <motion.button
              onClick={() => {
                setMobileOpen(false);
                openReservation();
              }}
              className="mt-4 font-body text-sm tracking-[0.2em] uppercase px-8 py-3 border border-gold text-gold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Réserver une Table
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
