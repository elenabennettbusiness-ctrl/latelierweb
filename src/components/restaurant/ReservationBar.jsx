import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { openReservation } from './ReservationModal';

/* ============================================================
   ReservationBar — sticky bottom booking bar.

   Not currently mounted anywhere; kept as-is for whenever it is.
   The overlay it used to own now lives in ReservationModal.jsx so
   the navbar and the Horaires CTA can open the same form — this
   bar just asks for it like every other trigger, which is why
   there is no form state here any more.
   ============================================================ */

export default function ReservationBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.2);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      id="reservation"
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
      initial={{ y: 80 }}
      animate={{ y: visible ? 0 : 80 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-auto flex items-center justify-between px-6 md:px-12 py-4"
        style={{
          background: 'linear-gradient(90deg, rgba(197,160,89,0.95), rgba(139,107,35,0.95))',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="hidden md:block">
          <p className="font-heading text-lg italic text-obsidian">Réservez votre table</p>
          <p className="font-body text-xs text-obsidian/60">Réservations acceptées · 05 35 75 76 19</p>
        </div>
        <button
          onClick={openReservation}
          className="font-body text-xs tracking-[0.2em] uppercase px-8 py-3 bg-obsidian text-gold hover:bg-obsidian/90 transition-colors w-full md:w-auto text-center"
        >
          Réserver une Table
        </button>
      </div>
    </motion.div>
  );
}
