import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShortTitle, deadlineInfo, scoreBand, criteriaRows, buildAdvice, answersToParam, companyLine } from './fiche';

test('short title: backend value, nature+city, else 60 chars', () => {
  assert.equal(buildShortTitle({ short: 'Maintenance des climatisations — Nanterre', officialTitle: 'x' }), 'Maintenance des climatisations — Nanterre');
  assert.equal(buildShortTitle({ officialTitle: 'x', nature: 'maintenance des climatisations', city: 'Nanterre' }), 'Maintenance des climatisations — Nanterre');
  const long = 'A'.repeat(100);
  assert.equal(buildShortTitle({ officialTitle: long }), 'A'.repeat(60) + '…');
});

test('deadline: J-N, amber when <= 7, impossible years ignored', () => {
  const now = new Date('2026-11-02T10:00:00Z');
  const far = deadlineInfo('2026-11-18T11:00:00Z', now);
  assert.match(far.text, /^Réponse avant le 18 nov\. 2026, 12 h · J-16$/);
  assert.equal(far.amber, false);
  assert.equal(deadlineInfo('2026-11-06T11:00:00Z', now).amber, true);
  assert.equal(deadlineInfo('7017-03-01T00:00:00Z', now).daysLeft, null);
  assert.equal(deadlineInfo('2026-10-01T00:00:00Z', now).closed, true);
});

test('bands', () => {
  assert.equal(scoreBand(70).label, 'Très adapté');
  assert.equal(scoreBand(69).label, 'À étudier');
  assert.equal(scoreBand(40).label, 'À étudier');
  assert.equal(scoreBand(39).label, 'Peu adapté');
});

test('criteria: unknown is never "Correspond"; always six rows', () => {
  const rows = criteriaRows([
    { key: 'metier', label: '', status: 'match', detail: 'ok', weight: 1, factor: 1, answered: false, evidence: 'verified_match' },
    { key: 'zone', label: '', status: 'match', detail: 'inconnu', weight: 1, factor: 0, answered: false, evidence: 'unknown' },
    { key: 'moyens', label: '', status: 'mismatch', detail: 'non', weight: 1, factor: 0, answered: true },
  ]);
  assert.equal(rows.length, 6);
  assert.equal(rows[0].status, 'Correspond');
  assert.equal(rows[1].status, 'Non précisé');
  assert.equal(rows[3].status, 'Ne correspond pas');
  assert.equal(rows[5].status, 'Non précisé'); // missing criterion
});

test('advice: sentence 1 depends on activity only', () => {
  const base = { nature: 'de maintenance', city: 'Nanterre', company: 'VERIFRANCE HABITAT', pct: 72 };
  const a = buildAdvice({ ...base, activity: 'match', answers: {} });
  const b = buildAdvice({ ...base, activity: 'match', answers: { location: 'non' } });
  assert.equal(a.sentences[0], "Ce marché de maintenance à Nanterre est en lien direct avec l'activité de VERIFRANCE HABITAT.");
  assert.equal(a.sentences[0], b.sentences[0]);
  assert.match(buildAdvice({ ...base, activity: 'confirm', answers: {} }).sentences[0], /proche de l'activité de VERIFRANCE HABITAT, sans y correspondre entièrement\.$/);
  assert.match(buildAdvice({ ...base, activity: 'mismatch', answers: {} }).sentences[0], /s'éloigne de l'activité/);
});

test('advice: sentence 2 and 3 rules', () => {
  const c = { nature: '', city: 'Lille', company: 'ACME', activity: 'match' as const };
  const nonZone = buildAdvice({ ...c, pct: 55, answers: { location: 'non', experience: 'non' } });
  assert.equal(nonZone.sentences[1], "Le lieu d'exécution est en dehors de votre zone d'intervention. Vous n'avez pas encore de référence similaire à présenter. C'est le principal point à voir ensemble.");
  assert.doesNotMatch(buildAdvice({ ...c, pct: 30, answers: { location: 'non' } }).sentences[1], /principal point/);
  assert.equal(buildAdvice({ ...c, pct: 55, answers: { experience: 'oui', calendar: 'oui', capacity: 'oui' } }).sentences[1], "Votre zone d'intervention reste à préciser.");
  assert.equal(buildAdvice({ ...c, pct: 55, answers: {} }).sentences[1], "Votre zone d'intervention, vos références sur des prestations similaires, vos délais et vos moyens restent à préciser.");
  assert.equal(buildAdvice({ ...c, pct: 55, answers: { location: 'oui', calendar: 'oui', capacity: 'oui' } }).sentences[1], 'Vos références sur des prestations similaires restent à préciser.');
  const all = buildAdvice({ ...c, pct: 75, answers: { location: 'oui', calendar: 'oui', capacity: 'oui', experience: 'oui' } });
  assert.equal(all.sentences[1], 'Vos réponses confirment les points clés : zone, délais, moyens et références.');
  assert.match(all.sentences[2], /dossier prérempli/);
  const mid = buildAdvice({ ...c, pct: 50, answers: { location: 'oui', calendar: 'oui', capacity: 'oui', experience: 'oui' } });
  assert.match(mid.sentences[2], /Un échange avec notre équipe/);
  const low = buildAdvice({ ...c, pct: 30, answers: {} });
  assert.equal(low.showBetterLink, true);
  assert.match(low.sentences[2], /D'autres marchés/);
});

test('answers param + company line', () => {
  assert.equal(answersToParam({ location: 'oui', experience: 'non' }), 'location:oui,experience:non');
  assert.equal(companyLine({ name: 'VERIFRANCE HABITAT', activity: 'Climatisation', city: 'Neuilly-sur-Seine', postal: '92200' }), 'VERIFRANCE HABITAT · Climatisation · Neuilly-sur-Seine (92)');
});
