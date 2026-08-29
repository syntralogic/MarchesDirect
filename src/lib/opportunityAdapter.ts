import type { ApiOpportunity } from './apiClient';
import type { Opportunity } from '@/data/mockData';

const JOURNEY_TO_TYPE: Record<ApiOpportunity['journey'], Opportunity['type']> = {
  public_procurement: 'public',
  tender: 'private',
  subcontracting: 'subcontracting',
};

function toDisplayStatus(apiStatus: string): Opportunity['status'] {
  switch (apiStatus) {
    case 'classified':
      return 'En cours';
    case 'submitted':
      return 'Déposé';
    case 'awarded':
      return 'Gagné';
    case 'lost':
      return 'Perdu';
    default:
      return 'Non analysé';
  }
}

function formatAmount(value: number | null, currency: string | null): string {
  if (value === null || value === undefined) return 'Montant non communiqué';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' ' + (currency || 'EUR');
}

export function apiOpportunityToDisplay(api: ApiOpportunity): Opportunity {
  return {
    id: api.id,
    title: api.title,
    // Buyer/organization name now comes straight from the API (see
    // marchesdirect-backend's opportunities.buyer_name), populated for
    // BOAMP-sourced records and demo/seed data. Still blank for
    // sources that don't expose it (TED, some PLACE records).
    organization: api.buyer_name || '',
    location: [api.location_city, api.location_region].filter(Boolean).join(', '),
    department: api.location_department || '',
    distance: '',
    amount: formatAmount(api.estimated_value, api.currency),
    deadline: api.deadline || '',
    status: toDisplayStatus(api.ai_classification_status),
    match: api.match_score ?? 0,
    type: JOURNEY_TO_TYPE[api.journey],
    sector: api.trade_name || '',
    saved: false,
    published: api.publication_date || undefined,
    description: api.description || undefined,
  };
}
