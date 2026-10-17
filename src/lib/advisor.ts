// Interlocutor configuration by opportunity type (client brief 17 Oct, follow-up, point 3).
// Elena stays the first contact for the three types (only the people and photos supplied by the client may be used),
// so only the support label changes. Used by the dossier support block; the same helper must feed the callback
// request, the appointment and the CRM so the same interlocutor/label follows the market consulted.

export type OpportunityJourney = 'tender' | 'public_procurement' | 'subcontracting' | string | null | undefined;

export const ADVISOR_FIRST_NAME = 'Elena';

export function advisorSupportLabel(journey: OpportunityJourney): string {
  if (journey === 'public_procurement') return 'Accompagnement marchés publics';
  if (journey === 'subcontracting') return 'Accompagnement sous-traitance';
  if (journey === 'tender') return 'Accompagnement appels d’offres privés';
  return 'Accompagnement appels d’offres';
}
