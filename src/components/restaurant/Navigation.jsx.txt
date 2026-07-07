import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';

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
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        initial={{ y: -80 }}
        animate={{ y: scrolled ? 0 : -80 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="pointer-events-auto mx-auto flex items-center justify-between px-6 md:px-12 py-4"
          style={{
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(197,160,89,0.2)',
          }}
        >
          <button onClick={() => scrollTo('hero')} className="flex items-center">
            <img
              src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
              alt="L'Atelier"
              className="h-10 w-auto"
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="font-body text-xs tracking-[0.15em] uppercase text-marble/70 hover:text-gold transition-colors duration-300"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            <button
              onClick={() => scrollTo('reservation')}
              className="font-body text-xs tracking-[0.15em] uppercase px-6 py-2.5 border border-gold text-gold hover:bg-gold hover:text-obsidian transition-all duration-300"
            >
              Réserver
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-marble"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
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
              onClick={() => scrollTo('reservation')}
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