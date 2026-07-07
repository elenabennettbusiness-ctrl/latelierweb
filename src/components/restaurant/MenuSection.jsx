import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const categories = [
  {
    id: 'salades',
    name: 'Salades',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/8f3d1806a_icon-salades.png',
    items: [
      { code: 'S1', name: 'La Niçoise', desc: 'Tomate, concombre, poivron, haricots, pomme de terre, oignon, œuf, thon', price: '59' },
      { code: 'S2', name: 'La Parmigiana', desc: 'Aubergine grillée, champignons, courgette, coulis de tomate, mozzarella', price: '59' },
      { code: 'S3', name: 'La Caprese', desc: 'Tomate, mozzarella, huile d\'olive, sauce pesto', price: '59' },
      { code: 'S4', name: 'Carpaccio de Bœuf', desc: 'Filet de bœuf finement coupé, roquette, câpres, parmesan', price: '65' },
      { code: 'S5', name: 'La Caesar', desc: 'Romaine, tomates cerises, poulet, mozzarella fraîche, croûtons, parmesan', price: '69' },
    ]
  },
  {
    id: 'grillades',
    name: 'Grillades',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/4ee1b08bc_icon-grillades.png',
    items: [
      { code: 'G1', name: 'Brochettes de Poulet', desc: 'Accompagnement au choix : frites ou pâtes ou riz ou légumes', price: '69' },
      { code: 'G2', name: 'Brochettes de Kefta', desc: 'Accompagnement au choix', price: '75' },
      { code: 'G3', name: 'Brochettes Mixte', desc: 'Accompagnement au choix', price: '85' },
      { code: 'G4', name: 'Brochettes de Bœuf', desc: 'Accompagnement au choix', price: '85' },
    ]
  },
  {
    id: 'viandes',
    name: 'Viandes',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/93eadf7fe_icon-viandes.png',
    items: [
      { code: 'V1', name: 'Escalope de Poulet', desc: 'Accompagnement : frites ou pâtes ou riz ou légumes', price: '79' },
      { code: 'V2', name: 'Steak Haché au Poivre', desc: 'Accompagnement au choix', price: '89' },
      { code: 'V3', name: 'Entrecôte', desc: 'Accompagnement au choix', price: '119' },
      { code: 'V4', name: 'Filet de Veau Grillé', desc: 'Accompagnement au choix', price: '125' },
    ]
  },
  {
    id: 'burgers',
    name: 'Burgers',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/6d17a7cb2_icon-burgers.png',
    items: [
      { code: 'B1', name: 'Kid\'s Burger', desc: 'Bun, viande de bœuf, Cheddar, Ketchup', price: '55' },
      { code: 'B2', name: 'Double Cheese', desc: 'Bun, viande de bœuf, Cheddar, Ketchup, moutarde, cornichon', price: '59' },
      { code: 'B3', name: 'Grill', desc: 'Bun, viande de bœuf, Cheddar, salade, tomate, oignon, roquette', price: '65' },
      { code: 'B5', name: 'Le Big Medina', desc: 'Bun, kefta, zaalouk, oignon caramélisé, salade, tomate, sauce mayo', price: '65' },
      { code: 'B6', name: 'Steakhouse', desc: 'Bun, viande de bœuf, Cheddar, bacon, tomate, salade, oignon, mayo, sauce BBQ', price: '79' },
      { code: 'B7', name: 'Bœuf Royal', desc: 'Bun, viande de bœuf à la flamme, Cheddar, sauce BBQ, mayo, salade, tomate', price: '85' },
    ]
  },
  {
    id: 'pizzas',
    name: 'Pizzas',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/eddf18be9_icon-pizzas.png',
    items: [
      { code: 'Z1', name: 'Margherita', desc: 'Sauce tomate, Mozzarella, Basilic, Origan', price: '55' },
      { code: 'Z2', name: 'Végétarienne', desc: 'Sauce tomate, Mozzarella, Tomate fraîche, Poivron, Oignon, Olives noires', price: '65' },
      { code: 'Z3', name: 'Al Funghi', desc: 'Sauce tomate, Mozzarella, Champignons, Basilic, Origan', price: '65' },
      { code: 'Z8', name: 'Chicken', desc: 'Sauce tomate, Mozzarella, Poulet, Champignons, Poivron', price: '75' },
      { code: 'Z10', name: 'Quatre Saisons', desc: 'Sauce tomate, Mozzarella, fruits de mer, kefta, 3 fromages, légumes', price: '85' },
      { code: 'Z12', name: 'L\'Atelier', desc: 'Sauce tomate, Mozzarella, Viande hachée, Cheddar, Tomates cerises', price: '85' },
    ]
  },
  {
    id: 'pasta',
    name: 'Pasta & Risotto',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/01ca51ef7_icon-pasta-risotto.png',
    items: [
      { code: 'P1', name: 'Penne Arrabiatta', desc: 'Sauce tomate, ail, basilic (sauce relevée)', price: '55' },
      { code: 'P2', name: 'Tagliatelle Carbonara', desc: 'Sauce blanche, jambon fumé, œuf, parmesan', price: '69' },
      { code: 'P4', name: 'Spaghetti Bolognaise', desc: 'Sauce tomate, viande hachée, mozzarella', price: '79' },
      { code: 'P6', name: 'Tagliatelle à la Truite', desc: 'Sauce blanche, truite fumée, champignons, herbes', price: '89' },
      { code: 'R1', name: 'Risotto Poulet', desc: 'Sauce à la crème, poulet, champignons, parmesan', price: '79' },
      { code: 'R2', name: 'Risotto Gambas', desc: 'Sauce à la crème, gambas, parmesan', price: '89' },
    ]
  },
  {
    id: 'poissons',
    name: 'Poissons',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/c87e31428_icon-poissons.png',
    items: [
      { code: 'F1', name: 'Colin en Tagine', desc: 'Filet de merlan façon tagine', price: '89' },
      { code: 'F2', name: 'Filet de Poisson', desc: 'Poisson du jour, spaghetti sauce champignons', price: '119' },
    ]
  },
  {
    id: 'desserts',
    name: 'Desserts',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/6540179cb_icon-desserts.png',
    items: [
      { code: 'D1', name: 'Crème Caramel', desc: '', price: '30' },
      { code: 'D2', name: 'Panna Cotta', desc: 'Fruits de saison', price: '30' },
      { code: 'D3', name: 'Tarte Fine aux Pommes', desc: '', price: '35' },
      { code: 'D4', name: 'Tiramisu', desc: '', price: '35' },
      { code: 'D5', name: 'Mousse au Chocolat', desc: '', price: '35' },
    ]
  },
  {
    id: 'boissons',
    name: 'Boissons',
    icon: 'https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/1fdb2ef6e_icon-sodas.png',
    items: [
      { code: '', name: 'Coca-Cola / Sprite / Pom\'s', desc: '', price: '15' },
      { code: '', name: 'Schweppes / Orangina', desc: '', price: '15-20' },
      { code: '', name: 'Jus d\'Orange / Citron', desc: 'Frais pressé', price: '20' },
      { code: '', name: 'Café Expresso / Américano', desc: '', price: '20' },
      { code: '', name: 'Cappuccino / Café au Lait', desc: '', price: '25' },
    ]
  },
];

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('salades');
  const [expandedCategory, setExpandedCategory] = useState('salades');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const activeCat = categories.find(c => c.id === activeCategory);

  return (
    <section id="menu" className="relative py-24 md:py-40 px-6 md:px-12 overflow-hidden">
      {/* Background image subtle */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url('https://media.base44.com/images/public/user_6a41c4d745d7d2a779b8a3c7/d2c5b3b09_munucenimaticimage.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.3em] uppercase text-gold mb-4">La Carte</p>
          <h2 className="font-heading text-4xl md:text-6xl font-light italic text-marble mb-4">
            Notre Menu
          </h2>
          <div className="gold-line w-16 mx-auto" />
        </motion.div>

        {/* Category icons ribbon */}
        <motion.div
          className="flex overflow-x-auto gap-2 md:gap-4 pb-4 mb-12 scrollbar-hide justify-start md:justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setExpandedCategory(cat.id); }}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-sm transition-all duration-300 flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gold/10 border border-gold/30'
                  : 'bg-transparent border border-transparent hover:border-gold/10'
              }`}
            >
              <img
                src={cat.icon}
                alt={cat.name}
                className="w-8 h-8 object-contain"
                style={{
                  filter: activeCategory === cat.id
                    ? 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(553%) hue-rotate(7deg) brightness(91%) contrast(86%)'
                    : 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(60%) contrast(100%)'
                }}
              />
              <span className={`font-body text-[10px] tracking-[0.15em] uppercase whitespace-nowrap ${
                activeCategory === cat.id ? 'text-gold' : 'text-marble/50'
              }`}>
                {cat.name}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Menu items */}
        <AnimatePresence mode="wait">
          {activeCat && (
            <motion.div
              key={activeCat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto"
            >
              <div className="space-y-0">
                {activeCat.items.map((item, i) => (
                  <motion.div
                    key={item.code + item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="group py-5 border-b border-gold/10 last:border-b-0"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          {item.code && (
                            <span className="font-body text-[10px] text-gold/60 tracking-wider">
                              {item.code}
                            </span>
                          )}
                          <h4 className="font-heading text-xl md:text-2xl font-light text-marble group-hover:text-gold transition-colors duration-300">
                            {item.name}
                          </h4>
                        </div>
                        {item.desc && (
                          <p className="font-body text-sm text-marble/40 mt-1 ml-0 md:ml-8">
                            {item.desc}
                          </p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span className="font-heading text-xl text-gold font-light">
                          {item.price}
                        </span>
                        <span className="font-body text-[10px] text-gold/50 uppercase">MAD</span>
                      </div>
                    </div>
                    {/* Gold dotted line */}
                    <div className="mt-2 border-b border-dotted border-gold/10" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View full menu images */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <p className="font-body text-xs text-marble/40 tracking-wider uppercase mb-2">
            Tous les prix en Dirhams Marocains (MAD)
          </p>
        </motion.div>
      </div>
    </section>
  );
}