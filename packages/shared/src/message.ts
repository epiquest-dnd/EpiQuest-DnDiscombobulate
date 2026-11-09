/**
 * Message renvoyé par le serveur ou le moteur de règles.
 *
 * Le serveur ne renvoie jamais de phrase : seulement un code et ses paramètres,
 * que le web et le mobile traduisent dans la langue de l'utilisateur (ADR-0004).
 *
 * @example { code: 'spell.slotUnavailable', params: { level: 3 } }
 */
export interface Message {
  code: string;
  params?: Record<string, string | number>;
}
