import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type React from 'react';
import CoordonneesScreen from '../CoordonneesScreen';
import ConfirmationScreen from '../ConfirmationScreen';
import { EMPTY_COORDS } from '@/lib/coordonnees';

const render = (el: React.ReactElement) => renderToString(el).replace(/<!-- -->/g, '');
const noop = () => {};
const form = { context: 'ACME · Entretien — Nanterre · réponse avant le 17 nov. 2026', errors: {}, submitting: false, submitError: null, onChange: noop, onSubmit: noop, onBack: noop, elenaPhoto: null };
const market = { shortTitle: 'Entretien — Nanterre', reference: '26-98064', deadline: '2099-11-17T12:00:00Z', deadlineText: '17 nov. 2099', daysLeft: 400, officialUrl: 'https://x.fr/avis' };
const company = { name: 'ACME', siret: '12345678901234', city: 'Nanterre', postal: '92000', activity: 'Climatisation' } as any;
const vals = { ...EMPTY_COORDS, phone: '06 12 34 56 78' };

describe('Coordonnées screen', () => {
  it('dossier: phone required, e-mail optional, no appointment imposed', () => {
    const h = render(<CoordonneesScreen {...form} choice="dossier" values={vals} />);
    expect(h).toContain('Préparez votre dossier pour ce marché');
    expect(h).toContain('(facultatif)');
    expect(h).toContain('Obtenir mon dossier prérempli');
    expect(h).toContain('Sans engagement · Données confidentielles');
    expect(h).toContain('type="tel"');
    expect(h).not.toMatch(/rendez-vous/i);
  });
  it('rappel: the three moments, no e-mail field', () => {
    const h = render(<CoordonneesScreen {...form} choice="rappel" values={{ ...vals, moment: 'tomorrow' }} />);
    expect(['Maintenant', 'Cet après-midi', 'Demain matin'].every((m) => h.includes(m))).toBe(true);
    expect(h).toContain('Être rappelé');
    expect(h).not.toContain('id="coord-email"');
  });
  it('question: required text, errors sit under the field, sending state on the button', () => {
    const h = render(<CoordonneesScreen {...form} choice="info" values={vals} errors={{ question: 'Écrivez votre question en une ou deux phrases.', phone: 'Indiquez votre numéro de téléphone.' }} submitting />);
    expect(h).toContain('Quelle est votre question ?');
    expect(h).toContain('Écrivez votre question en une ou deux phrases.');
    expect(h).toContain('Envoi…');
    expect(h).not.toContain('role="alert"');
  });
});

describe('Confirmation screen', () => {
  const base = { company, market, onDownload: noop, onAppointment: noop, onBackToMarket: noop, elenaPhoto: null };
  it('dossier with a real file: download button, dossier section open', () => {
    const h = render(<ConfirmationScreen {...base} choice="dossier" values={vals} pdf="ready" />);
    expect(h).toContain('Votre dossier est prêt');
    expect(h).toContain('Télécharger mon dossier prérempli (PDF)');
    expect(h).toMatch(/<details open/);
    expect(h).toContain('Qui fait quoi');
    expect(h).toContain('17 novembre 2099');
  });
  it('dossier without a file: no dead button, says it comes after the call', () => {
    const h = render(<ConfirmationScreen {...base} choice="dossier" values={vals} pdf="unavailable" />);
    expect(h).not.toContain('Télécharger mon dossier prérempli (PDF)');
    expect(h).toContain('disponible après l’appel d’Elena');
  });
  it('rappel: preference box with the moment, "dans l’heure" only for Maintenant, dossier folded', () => {
    const later = render(<ConfirmationScreen {...base} choice="rappel" values={{ ...vals, moment: 'tomorrow' }} pdf="unavailable" />);
    expect(later).toContain('Demain matin');
    expect(later).toContain('demain matin');
    expect(later).not.toMatch(/rappelle au 06 12 34 56 78 dans l’heure/);
    expect(later).not.toMatch(/<details open/);
    const now = render(<ConfirmationScreen {...base} choice="rappel" values={{ ...vals, moment: 'now' }} pdf="unavailable" />);
    expect(now).toContain('06 12 34 56 78 dans l’heure (9 h–18 h)');
  });
  it('question: quotes the question back; no e-mail promise anywhere', () => {
    const h = render(<ConfirmationScreen {...base} choice="info" values={{ ...vals, question: 'Puis-je répondre seul ?' }} pdf="unavailable" />);
    expect(h).toContain('« Puis-je répondre seul ? »');
    expect(h.toLowerCase()).not.toMatch(/e-mail (envoy|de confirmation)|par e-mail|vous recevrez/);
  });
});
