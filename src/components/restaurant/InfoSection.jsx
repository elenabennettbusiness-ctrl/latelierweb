import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CreditCard, Utensils, Music, Accessibility, Baby } from 'lucide-react';

/* Address, phone, hours and parking used to live here too. They now belong
   to LocationSection, which sits directly above this one — this section
   covers what the restaurant offers rather than where to find it. */
const infoGroups = [
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
            Bon à Savoir
          </h2>
          <div className="gold-line w-16 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10"
        >
          {infoGroups.map((group, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gold">{group.icon}</span>
                <h3 className="font-heading text-base text-gold">{group.title}</h3>
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
    </section>
  );
}