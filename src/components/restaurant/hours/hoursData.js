/* ============================================================
   hoursData — single source of truth for the "Horaires
   d'Ouverture" section.

   To change the opening hours, edit SCHEDULE below and nothing
   else: HoursSection renders whatever is here, so the JSX never
   needs touching. Each day carries a list of `slots`, so a day
   can have one service, two, or none (see `slots: []` for a
   closing day — the section prints CLOSED_LABEL instead).

   The two portraits live in public/Hours/ and are referenced by
   public-root URL — the same convention AboutSection.jsx uses for
   /Histoire/*.webp. They are deliberately not run through Vite:
   anything under public/ is served byte-for-byte at its own path,
   which is what keeps the files from being renamed or moved.
   HoursSection skips a figure whose entry is missing, so the
   section still stands up if a file is ever removed.
   ============================================================ */

// First entry is the left portrait, second the right.
export const HOURS_IMAGES = ['/Hours/1.webp', '/Hours/2.webp'];

// Both files are 1334x2000 (2:3 portrait), matching the frames' aspect-ratio
// exactly, so nothing is cropped. Declared on the <img> to reserve the box
// before decode — the anti-CLS trick DishCard.jsx uses for the dish photos.
export const HOURS_IMAGE_NATURAL = { width: 1334, height: 2000 };

// Alt text is content, not decoration — it describes each photograph to anyone
// who cannot see it, so it has to match what is actually in frame. Reviewed
// against public/Hours/1.webp and 2.webp; revisit if either file is replaced.
export const HOURS_IMAGE_ALTS = [
  "L'équipe de cuisine de L'Atelier au travail devant la grande verrière",
  'Dressage à la pince d\'un plat de pâtes, accompagné d\'un verre de vin blanc',
];

export const CLOSED_LABEL = 'Fermé';

export const SCHEDULE = [
  { day: 'Lundi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Mardi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Mercredi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Jeudi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Vendredi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Samedi', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
  { day: 'Dimanche', slots: ['12:00 – 15:00', '19:00 – 23:30'] },
];
