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
  it('dossier: phone required, e-mail optional, call moment chosen in the same form (5 Nov: one click = dossier + call)', () => {
    const h = render(<CoordonneesScreen {...form} choice="dossier" values={{ ...vals, moment: 'now' }} slots={[{ slotAt: '2099-11-18T08:00:00.000Z', label: 'Jeu. 18 nov. · 09:00' }]} />);
    expect(h).toContain('Votre dossier, et votre créneau avec Elena');
    expect(h).toContain('(facultatif)');
    expect(h).toContain('Recevoir mon dossier');
    expect(h).toContain('Quand Elena vous appelle-t-elle ?');
    expect(h).toContain('Dès que possible');
    expect(h).toContain('Jeu. 18 nov.');
    expect(h).toContain('Sans engagement · Données confidentielles');
    expect(h).toContain('type="tel"');
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
  it('dossier with a real file: download button, call announced, dossier folded, nothing sold', () => {
    const h = render(<ConfirmationScreen {...base} choice="dossier" values={{ ...vals, slotAt: '2099-11-18T08:00:00.000Z', slotLabel: 'Jeu. 18 nov. · 09:00' }} pdf="ready" />);
    expect(h).toContain('Dossier prêt. Elena vous appelle Jeu. 18 nov. · 09:00');
    expect(h).toContain('Télécharger mon dossier prérempli (PDF)');
    expect(h).toContain('Ce que vous verrez avec Elena');
    expect(h).not.toMatch(/<details open/);
    expect(h).not.toContain('Demander mes 30 minutes offertes');
  });
  it('dossier without a file: no dead button, says it comes with the call', () => {
    const h = render(<ConfirmationScreen {...base} choice="dossier" values={{ ...vals, moment: 'now' }} pdf="unavailable" />);
    expect(h).not.toContain('Télécharger mon dossier prérempli (PDF)');
    expect(h).toContain('remis lors de l’appel');
    expect(h).toContain('dès que possible');
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

describe('Coordonnées screen - general question and alert (no market)', () => {
  it('question without market: no step bar, custom back label, no e-mail field', () => {
    const h = render(<CoordonneesScreen {...form} choice="info" values={vals} hideSteps backLabel="Retour" />);
    expect(h).toContain('Quelle est votre question ?');
    expect(h).toContain('‹ Retour');
    expect(h).not.toContain('Retour au marché');
    expect(h).not.toContain('3 · Mon dossier');
    expect(h).not.toContain('id="coord-email"');
  });
  it('alerte: phone only, calls only when a market matches, no e-mail promise', () => {
    const h = render(<CoordonneesScreen {...form} choice="alerte" values={vals} />);
    expect(h).toContain('Être prévenu des prochains marchés');
    expect(h).toContain('Être prévenu');
    expect(h).not.toContain('id="coord-email"');
    expect(h).not.toContain('id="coord-question"');
  });
  it('alerte confirmation: shows company and phone, no PDF, no 30-minute card', () => {
    const h = render(<ConfirmationScreen choice="alerte" values={vals} company={company} market={market} pdf="unavailable" onDownload={noop} onAppointment={noop} onBackToMarket={noop} elenaPhoto={null} />);
    expect(h).toContain('Votre alerte est enregistrée');
    expect(h).toContain('ACME');
    expect(h).not.toContain('Télécharger');
    expect(h).not.toContain('30 minutes offertes');
  });
});
