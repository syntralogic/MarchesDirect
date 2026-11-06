import { describe, it, expect, beforeEach } from 'vitest';
import { validateCoords, formatPhone, callWhen, leadMessage, calendarRows, pdfFileName, loadCoords, saveCoords, EMPTY_COORDS, COPY } from '../coordonnees';

const ok = { ...EMPTY_COORDS, phone: '06 12 34 56 78' };
const okDossier = { ...ok, moment: 'now' as const }; // dossier = « dès que possible » ou un créneau (décision client du 5 nov.)

describe('validateCoords', () => {
  it('phone is required everywhere, with a precise message under the field', () => {
    for (const c of ['dossier', 'rappel', 'info'] as const) {
      const v = c === 'rappel' ? { ...EMPTY_COORDS, moment: 'now' as const } : c === 'info' ? { ...EMPTY_COORDS, question: 'Quel délai ?' } : EMPTY_COORDS;
      expect(validateCoords(c, v).phone).toBe('Indiquez votre numéro de téléphone.');
    }
    expect(validateCoords('dossier', { ...ok, phone: '0612' }).phone).toContain('10 chiffres');
    expect(validateCoords('dossier', okDossier)).toEqual({});
  });
  it('accepts +33 and spaced numbers, refuses 0000000000', () => {
    expect(validateCoords('dossier', { ...okDossier, phone: '+33 6 12 34 56 78' })).toEqual({});
    expect(validateCoords('dossier', { ...ok, phone: '0000000000' }).phone).toBeTruthy();
  });
  it('e-mail is optional for the dossier, validated only when given', () => {
    expect(validateCoords('dossier', { ...ok, email: '' }).email).toBeUndefined();
    expect(validateCoords('dossier', { ...ok, email: 'nope' }).email).toContain('pas valide');
    expect(validateCoords('dossier', { ...ok, email: 'a@b.fr' }).email).toBeUndefined();
  });
  it('rappel needs a moment, question needs text', () => {
    expect(validateCoords('rappel', ok).moment).toBeTruthy();
    expect(validateCoords('rappel', { ...ok, moment: 'tomorrow' })).toEqual({});
    expect(validateCoords('info', ok).question).toBe('Écrivez votre question en une ou deux phrases.');
    expect(validateCoords('info', { ...ok, question: '  ' }).question).toBeTruthy();
    expect(validateCoords('info', { ...ok, question: 'Quel délai ?' })).toEqual({});
  });
});

describe('wording rules', () => {
  it('never says "dans l’heure" with another moment than Maintenant', () => {
    expect(callWhen('now')).toContain('dans l’heure');
    expect(callWhen('afternoon')).toBe('cet après-midi');
    expect(callWhen('tomorrow')).toBe('demain matin');
  });
  it('never promises an e-mail', () => {
    const all = JSON.stringify(COPY).toLowerCase();
    expect(all).not.toMatch(/e-mail (envoy|de confirmation)|par e-mail|vous recevrez/);
  });
  it('formats the phone for display', () => expect(formatPhone('+33612345678')).toBe('06 12 34 56 78'));
  it('saves the chosen moment and the question text with the request', () => {
    expect(leadMessage('rappel', { ...ok, moment: 'tomorrow' })).toBe('Moment de rappel souhaité : Demain matin');
    expect(leadMessage('info', { ...ok, question: ' Quel délai ? ' })).toBe('Quel délai ?');
    expect(leadMessage('dossier', ok)).toBeUndefined();
  });
});

describe('calendar until the deadline', () => {
  const now = new Date(2026, 10, 2, 10, 0);
  it('is computed from the real deadline, with the 2-days-before line only when there is room', () => {
    const rows = calendarRows({ deadline: new Date(2026, 10, 17, 12, 0), choice: 'dossier', moment: null, now });
    expect(rows.map((r) => r.when)).toEqual(['Aujourd’hui', 'Dans l’heure (9 h–18 h)', 'Les jours suivants', '2 jours avant la date limite', '17 novembre 2026']);
    const tight = calendarRows({ deadline: new Date(2026, 10, 4, 12, 0), choice: 'dossier', moment: null, now });
    expect(tight.map((r) => r.when)).not.toContain('2 jours avant la date limite');
  });
  it('second line follows the chosen moment and omits the deadline when unknown or past', () => {
    expect(calendarRows({ deadline: null, choice: 'rappel', moment: 'tomorrow', now })[1].when).toBe('Demain matin');
    expect(calendarRows({ deadline: new Date(2026, 9, 1), choice: 'dossier', moment: null, now })).toHaveLength(3);
  });
});

describe('pdf file name and kept entries', () => {
  beforeEach(() => sessionStorage.clear());
  it('names the file after the company, ASCII only', () => {
    expect(pdfFileName('Vérifrance Habitat & Fils', '26-98064')).toBe('Dossier-Verifrance-Habitat-Fils-26-98064.pdf');
    expect(pdfFileName(null, null)).toBe('Dossier.pdf');
  });
  it('keeps what was typed when the visitor comes back', () => {
    saveCoords({ ...ok, email: 'a@b.fr', question: 'Q ?', moment: 'now' });
    expect(loadCoords()).toMatchObject({ phone: '06 12 34 56 78', email: 'a@b.fr', question: 'Q ?', moment: 'now' });
  });
});

describe('alerte nouveaux marchés', () => {
  it('needs only a valid phone number (no e-mail, no moment, no question)', () => {
    expect(validateCoords('alerte', ok)).toEqual({});
    expect(validateCoords('alerte', EMPTY_COORDS).phone).toBeTruthy();
    expect(validateCoords('alerte', { ...ok, phone: '12' }).phone).toBeTruthy();
  });
  it('saves a message for Elena and never promises an e-mail', () => {
    const m = leadMessage('alerte', ok, 'Climatisation · Neuilly-sur-Seine et alentours');
    expect(m).toContain('Climatisation');
    expect(m?.toLowerCase()).not.toContain('e-mail');
    expect(Object.values(COPY.alerte.done).join(' ').toLowerCase()).not.toMatch(/vous recevrez|envoy.*e-mail/);
  });
});
