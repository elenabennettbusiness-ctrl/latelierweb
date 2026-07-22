import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Clock } from 'lucide-react';

/* ============================================================
   ReservationModal — the booking overlay, lifted verbatim out of
   ReservationBar.jsx so more than one place can open it.

   It owns no trigger of its own: mount it once (Home.jsx) and
   open it from anywhere with `openReservation()`. A window event
   rather than context/props, because the callers (the fixed
   navbar, the Horaires CTA, the sticky bar) sit in unrelated
   branches of the tree and sharing state between them would mean
   threading a provider through the whole page for one modal.
   ============================================================ */

export const RESERVATION_EVENT = 'latelier:open-reservation';

export function openReservation() {
  window.dispatchEvent(new Event(RESERVATION_EVENT));
}

export default function ReservationModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    notes: '',
  });
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => {
      // Remember the trigger so focus can go back where it came from.
      lastFocusedRef.current = document.activeElement;
      setOpen(true);
    };
    window.addEventListener(RESERVATION_EVENT, handleOpen);
    return () => window.removeEventListener(RESERVATION_EVENT, handleOpen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSubmitted(false);
    const last = lastFocusedRef.current;
    if (last && typeof last.focus === 'function') last.focus();
  }, []);

  // Escape to dismiss, and freeze the page behind the overlay so a scroll
  // gesture over the backdrop doesn't drift the page underneath.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setFormData({ name: '', phone: '', date: '', time: '', guests: '2', notes: '' });
    }, 3000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-obsidian/95 backdrop-blur-lg"
            onClick={close}
            aria-hidden="true"
          />

          {/* Content */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-modal-title"
            tabIndex={-1}
            className="relative w-full max-w-lg z-10 outline-none"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="absolute -top-12 right-0 text-marble/60 hover:text-gold transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-10">
              <img
                src="https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/560a45fdc_Logov1.png"
                alt="L'Atelier"
                className="h-12 w-auto mx-auto mb-6"
              />
              <h2
                id="reservation-modal-title"
                className="font-heading text-3xl md:text-4xl font-light italic text-marble"
              >
                Réserver une Table
              </h2>
              <div className="gold-line w-12 mx-auto mt-4" />
            </div>

            {submitted ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold flex items-center justify-center">
                  <span className="text-gold text-2xl">✓</span>
                </div>
                <h3 className="font-heading text-2xl text-gold mb-2">Merci !</h3>
                <p className="font-body text-sm text-marble/60">
                  Votre demande de réservation a bien été envoyée.<br />
                  Nous vous contacterons pour confirmer.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 block">Nom</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 block">Téléphone</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble focus:border-gold outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 flex items-center gap-1">
                      <Calendar size={10} /> Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 flex items-center gap-1">
                      <Clock size={10} /> Heure
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 flex items-center gap-1">
                      <Users size={10} /> Personnes
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble focus:border-gold outline-none transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n} className="bg-obsidian">{n}</option>
                      ))}
                      <option value="10+" className="bg-obsidian">10+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-body text-[10px] tracking-[0.2em] uppercase text-marble/40 mb-1 block">Notes (optionnel)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anniversaire, allergie, etc."
                    className="w-full bg-transparent border-b border-gold/30 py-2 font-body text-sm text-marble placeholder:text-marble/20 focus:border-gold outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 mt-4 font-body text-xs tracking-[0.2em] uppercase bg-gold text-obsidian hover:bg-gold-dark transition-colors duration-300 rounded-[var(--btn-radius)]"
                >
                  Confirmer la Réservation
                </button>

                <p className="text-center font-body text-[10px] text-marble/30">
                  Ou appelez-nous directement au{' '}
                  <a href="tel:+212535757619" className="text-gold hover:underline">05 35 75 76 19</a>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
