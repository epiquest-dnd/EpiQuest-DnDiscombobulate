import { z } from 'zod';

/**
 * Message renvoyé par le serveur ou le moteur de règles.
 *
 * Le serveur ne renvoie jamais de phrase : seulement un code et ses paramètres,
 * que le web et le mobile traduisent dans la langue de l'utilisateur (ADR-0004).
 *
 * @example { code: 'spell.slotUnavailable', params: { level: 3 } }
 */
export const messageSchema = z
  .object({
    code: z.string(),
    params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  })
  .meta({ id: 'Message' });

export type Message = z.infer<typeof messageSchema>;
