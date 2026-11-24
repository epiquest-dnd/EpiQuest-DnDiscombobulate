import { pgSchema } from 'drizzle-orm/pg-core';

// Deux schémas PostgreSQL distincts (modele-de-donnees.md, section 1) :
// - rules : données de règles, écrites uniquement par le script d'import (#20) ;
// - game : données de partie, écrites par le serveur.
// Les fichiers de tables importent ce fichier, jamais index.ts (import circulaire).
export const rules = pgSchema('rules');
export const game = pgSchema('game');
