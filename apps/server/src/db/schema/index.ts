import { pgSchema } from 'drizzle-orm/pg-core';

// Deux schémas PostgreSQL distincts (modele-de-donnees.md, section 1) :
// - rules : données de règles, écrites uniquement par le script d'import (#20) ;
// - game : données de partie, écrites par le serveur.
// Les tables sont déclarées dans schema/game/ et schema/rules/, puis réexportées ici.
export const rules = pgSchema('rules');
export const game = pgSchema('game');
