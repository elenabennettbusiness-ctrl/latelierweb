import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Globe, Clock, Car, CreditCard, Utensils, Music, Accessibility, Users, Baby } from 'lucide-react';

const infoGroups = [
  {
    icon: <Clock size={20} />,
    title: 'Horaires',
    items: ['Ouvert tous les jours', 'Déjeuner & Dîner', 'Fermeture à 23h00']
  },
  {
    icon: <Utensils size={20} />,
    title: 'Services',
    items: ['Repas sur place', 'Vente à emporter', 'Terrasse', 'Service à table', 'Traiteur']
  },
  {
    icon: <Music size={20} />,
    title: 'Ambiance',
    items: ['Concerts live', 'Cadre agréable', 'Ambiance décontractée', 'Branché & Calme']
  },
  {
    icon: <CreditCard size={20} />,
    title: 'Paiements',
    items: ['Cartes de crédit', 'Cartes de débit', '50–250 MAD / personne']
  },
  {
    icon: <Car size={20} />,
    title: 'Parking',
    items: ['Parking gratuit', 'Stationnement facile']
  },
  {
    icon: <Baby size={20} />,
    title: 'Familles',
    items: ['Convient aux enfants', 'Menu enfant', 'Groupes & Touristes']
  },
  {
    icon: <Accessibility size={20} />,
    title: 'Accessibilité',
    items: ['Places assises accessibles en fauteuil roulant']
  },
  {
    icon: <Utensils size={20} />,
    title: 'Offre',
    items: ['Plats halal', 'Excellents cocktails', 'Excellent café', 'Excellents desserts', 'Service ouvert tard']
  },
];

export default function InfoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="info" className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">Informations</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
            Nous Retrouver
          </h2>
          <div className="gold-line w-16 mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Contact & Location */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-gold mt-1 flex-shrink-0" />
                <div>
                  <p className="font-heading text-lg text-marble">Adresse</p>
                  <p className="font-body text-sm text-marble/60 mt-1">
                    Rond point Marjane Oued Fès, rocade,<br />
                    Rte Principale Fès Meknès, Fès 30000
                  </p>
                  <a
                    href="https://www.google.com/maps/place/L%E2%80%99atelier+Restaurant/@34.0479463,-5.0378838,17z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-body text-xs text-gold hover:text-gold-dark mt-2 tracking-wider uppercase transition-colors"
                  >
                    Voir sur Google Maps →
                  </a>
                </div>
              </div>

              <div className="gold-line w-full" />

              <div className="flex items-start gap-4">
                <Phone size={20} className="text-gold mt-1 flex-shrink-0" />
                <div>
                  <p className="font-heading text-lg text-marble">Téléphone</p>
                  <a href="tel:+212535757619" className="font-body text-sm text-marble/60 hover:text-gold mt-1 block transition-colors">
                    05 35 75 76 19
                  </a>
                </div>
              </div>

              <div className="gold-line w-full" />

              <div className="flex items-start gap-4">
                <Globe size={20} className="text-gold mt-1 flex-shrink-0" />
                <div>
                  <p className="font-heading text-lg text-marble">En Ligne</p>
                  <a href="https://latelierrestaurant.ma" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-marble/60 hover:text-gold mt-1 block transition-colors">
                    latelierrestaurant.ma
                  </a>
                  <a href="https://instagram.com/latelier_restaurant_fes" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-marble/60 hover:text-gold mt-1 block transition-colors">
                    @latelier_restaurant_fes
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 gap-6"
          >
            {infoGroups.map((group, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gold">{group.icon}</span>
                  <h4 className="font-heading text-base text-gold">{group.title}</h4>
                </div>
                {group.items.map((item, j) => (
                  <p key={j} className="font-body text-xs text-marble/50 leading-relaxed pl-7">
                    {item}
                  </p>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}