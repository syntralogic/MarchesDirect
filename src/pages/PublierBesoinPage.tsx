import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { needsApi, getApiErrorMessage } from '@/lib/apiClient';
import { DEPARTMENTS } from '@/data/departments';
import { getSessionId } from '@/lib/visitorTracking';

// « Publier un besoin » (7 nov., décisions de Hedi) : gratuit ; un formulaire ; relu par l'équipe avant publication ;
// les candidatures arrivent chez Marchés Direct, qui présente les entreprises correspondant aux critères du donneur d'ordre.
const TRADES: [string, string][] = [['gros-oeuvre', 'Gros œuvre'], ['maconnerie', 'Maçonnerie'], ['demolition', 'Démolition'], ['charpente', 'Charpente'],
  ['couverture', 'Couverture, étanchéité'], ['electricite', 'Électricité'], ['plomberie', 'Plomberie'], ['cvc', 'Chauffage, ventilation, climatisation'],
  ['isolation', 'Isolation'], ['platrerie', 'Plâtrerie'], ['menuiserie', 'Menuiserie'], ['carrelage', 'Carrelage'], ['peinture', 'Peinture'],
  ['vitrerie', 'Vitrerie'], ['vrd', 'Voirie et réseaux'], ['batiment-general', 'Tous corps d’état'], ['espaces-verts', 'Espaces verts'],
  ['nettoyage', 'Nettoyage'], ['maintenance', 'Maintenance']];
const KINDS = ['Entreprise générale', 'Syndic ou copropriété', 'Promoteur, bailleur', 'Commerce, entreprise', 'Particulier', 'Autre'];

type F = Record<string, string>;
const FIELD = 'h-[52px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3 text-[16px] text-[#0A1628] focus:border-[#F97316] focus:outline-none';
const AREA = 'min-h-[130px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white p-3 text-[16px] text-[#0A1628] focus:border-[#F97316] focus:outline-none';
const LBL = 'mt-4 block text-[14px] font-extrabold';
const chip = (on: boolean) => `min-h-[44px] rounded-full border px-3.5 text-[14px] font-bold ${on ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468] text-[#D6E0EC]'}`;

export default function PublierBesoinPage() {
  const [f, setF] = useState<F>({ journey: 'subcontracting', clientKind: '', department: '' });
  const [trades, setTrades] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [errors, setErrors] = useState<F>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => { setF(x => ({ ...x, [k]: e.target.value })); setErrors(x => ({ ...x, [k]: '' })); };
  const err = (k: string) => errors[k] ? <p role="alert" className="mt-1 text-[13px] text-[#FCA5A5]">{errors[k]}</p> : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const r = await needsApi.submit({ ...f, trades, recurring, lots: (f.lots || '').split('\n').map(s => s.trim()).filter(Boolean), sessionId: getSessionId() });
      setDone(r.reference || 'ok'); window.scrollTo({ top: 0 });
    } catch (ex: any) {
      const fields = ex?.response?.data?.fields;
      if (fields) { setErrors(fields); setError('Quelques informations manquent : elles sont indiquées en rouge.'); }
      else setError(getApiErrorMessage(ex, 'L’envoi n’a pas abouti. Réessayez dans un instant.'));
    } finally { setBusy(false); }
  };

  const shell = 'mx-auto w-full max-w-[640px] px-4 pb-24 pt-5 text-[#F2F5F9]';
  if (done) return (
    <main className={shell}>
      <PageMeta title="Besoin reçu | Marchés Direct" description="Votre besoin a bien été reçu." noindex />
      <section role="status" className="rounded-2xl border border-[#1E6B4A] bg-[#123B2A] p-5">
        <h1 className="text-[22px] font-extrabold text-[#6EE7B7]">✓ Besoin reçu{done !== 'ok' ? ` (réf. ${done})` : ''}</h1>
        <p className="mt-2 text-[15px] text-[#E8FFF4]">Notre équipe relit votre annonce, vous appelle si une précision manque, puis la publie. Nous recevons les candidatures et vous présentons les entreprises qui correspondent à vos critères.</p>
      </section>
      <Link to="/" className="mt-5 inline-block font-bold text-[#FB923C] underline">Retour à l’accueil</Link>
    </main>
  );

  return (
    <main className={shell}>
      <PageMeta title="Publier un besoin : trouvez une entreprise du bâtiment | Marchés Direct" canonicalPath="/publier-un-besoin"
        description="Entreprise générale, syndic, promoteur, commerce : publiez gratuitement votre besoin de travaux ou de sous-traitance. Nous recevons les candidatures et vous présentons les entreprises qui correspondent à vos critères." />
      <p className="text-[12px] font-extrabold uppercase tracking-[.1em] text-[#FB923C]">Donneurs d’ordre · gratuit</p>
      <h1 className="mt-1 text-[26px] font-extrabold leading-tight md:text-[32px]">Publier un besoin</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#D6E0EC]">Décrivez vos travaux ou la mission à sous-traiter. Notre équipe relit l’annonce avant de la publier, reçoit les candidatures des artisans et vous présente celles qui correspondent à vos critères. Vos coordonnées ne sont jamais affichées.</p>
      <ol className="mt-4 grid gap-2 text-[13.5px] text-[#D6E0EC] sm:grid-cols-3">
        {['Vous décrivez le besoin (3 minutes)', 'Nous relisons et publions', 'Nous vous présentons les entreprises retenues'].map((t, i) =>
          <li key={t} className="rounded-xl border border-[#22385A] bg-[#12233A] p-3"><b className="text-[#FB923C]">{i + 1}.</b> {t}</li>)}
      </ol>

      <form onSubmit={submit} noValidate className="mt-6 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 md:p-6">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" onChange={set('website')} />
        <span className={LBL.replace('mt-4 ', '')}>Vous cherchez</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Type de besoin">
          <button type="button" className={chip(f.journey === 'subcontracting')} onClick={() => setF(x => ({ ...x, journey: 'subcontracting' }))}>Un sous-traitant</button>
          <button type="button" className={chip(f.journey === 'tender')} onClick={() => setF(x => ({ ...x, journey: 'tender' }))}>Une entreprise pour des travaux</button>
        </div>

        <label className={LBL} htmlFor="b-title">Votre besoin en une phrase</label>
        <input id="b-title" className={FIELD} placeholder="Ex. : Pose de 12 climatiseurs dans des bureaux" value={f.title || ''} onChange={set('title')} maxLength={200} />{err('title')}
        <label className={LBL} htmlFor="b-desc">Prestations attendues</label>
        <textarea id="b-desc" className={AREA} placeholder="Nature des travaux, quantités, contraintes d’accès, matériel fourni ou non…" value={f.description || ''} onChange={set('description')} maxLength={5000} />{err('description')}

        <span className={LBL}>Métiers concernés</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Métiers">
          {TRADES.map(([k, l]) => <button key={k} type="button" aria-pressed={trades.includes(k)} className={chip(trades.includes(k))}
            onClick={() => setTrades(t => t.includes(k) ? t.filter(x => x !== k) : [...t, k].slice(0, 8))}>{trades.includes(k) ? '✓ ' : ''}{l}</button>)}
        </div>
        <label className={LBL} htmlFor="b-lots">Lots ou étapes <span className="font-normal text-[#B4C1D3]">(facultatif, un par ligne)</span></label>
        <textarea id="b-lots" className={`${AREA} min-h-[90px]`} value={f.lots || ''} onChange={set('lots')} />

        <div className="grid gap-x-3 sm:grid-cols-2">
          <div><label className={LBL} htmlFor="b-dep">Département des travaux</label>
            <select id="b-dep" className={FIELD} value={f.department} onChange={set('department')}><option value="">Choisir</option>{DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}</select>{err('department')}</div>
          <div><label className={LBL} htmlFor="b-city">Commune <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="b-city" className={FIELD} value={f.city || ''} onChange={set('city')} autoComplete="address-level2" /></div>
          <div><label className={LBL} htmlFor="b-min">Budget minimum HT <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="b-min" className={FIELD} inputMode="numeric" placeholder="€" value={f.budgetMin || ''} onChange={set('budgetMin')} /></div>
          <div><label className={LBL} htmlFor="b-max">Budget maximum HT <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="b-max" className={FIELD} inputMode="numeric" placeholder="€" value={f.budgetMax || ''} onChange={set('budgetMax')} />{err('budgetMax')}</div>
          <div><label className={LBL} htmlFor="b-dl">Réponses attendues avant le <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="b-dl" type="date" className={FIELD} value={f.deadline || ''} onChange={set('deadline')} />{err('deadline')}</div>
          <div><label className={LBL} htmlFor="b-start">Démarrage souhaité <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="b-start" type="date" className={FIELD} value={f.startDate || ''} onChange={set('startDate')} /></div>
        </div>
        <label className="mt-4 flex min-h-[44px] items-center gap-2 text-[14px]"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="h-5 w-5" /> Contrat récurrent (entretien, maintenance, interventions régulières)</label>
        <label className={LBL} htmlFor="b-crit">Vos critères pour choisir l’entreprise <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
        <textarea id="b-crit" className={`${AREA} min-h-[90px]`} placeholder="Qualifications (RGE, Qualibat…), assurance décennale, taille d’équipe, délai, références…" value={f.criteria || ''} onChange={set('criteria')} maxLength={2000} />

        <h2 className="mt-6 border-t border-[#2B4468] pt-4 text-[17px] font-extrabold">Vos coordonnées <span className="text-[13px] font-normal text-[#B4C1D3]">(jamais affichées)</span></h2>
        <span className={LBL}>Vous êtes</span>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Vous êtes">
          {KINDS.map(k => <button key={k} type="button" className={chip(f.clientKind === k)} onClick={() => setF(x => ({ ...x, clientKind: x.clientKind === k ? '' : k }))}>{k}</button>)}
        </div>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <div><label className={LBL} htmlFor="b-co">Société ou organisme</label><input id="b-co" className={FIELD} value={f.companyName || ''} onChange={set('companyName')} autoComplete="organization" />{err('companyName')}</div>
          <div><label className={LBL} htmlFor="b-siret">SIRET <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label><input id="b-siret" className={FIELD} inputMode="numeric" value={f.siret || ''} onChange={set('siret')} /></div>
          <div><label className={LBL} htmlFor="b-name">Votre nom</label><input id="b-name" className={FIELD} value={f.contactName || ''} onChange={set('contactName')} autoComplete="name" />{err('contactName')}</div>
          <div><label className={LBL} htmlFor="b-tel">Téléphone</label><input id="b-tel" type="tel" className={FIELD} value={f.phone || ''} onChange={set('phone')} autoComplete="tel" inputMode="tel" />{err('phone')}</div>
          <div className="sm:col-span-2"><label className={LBL} htmlFor="b-mail">E-mail</label><input id="b-mail" type="email" className={FIELD} value={f.email || ''} onChange={set('email')} autoComplete="email" inputMode="email" />{err('email')}</div>
        </div>
        {error && <p role="alert" className="mt-4 text-[14px] text-[#FCA5A5]">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 text-[17px] font-extrabold text-white disabled:opacity-60">{busy ? 'Envoi…' : 'Publier mon besoin gratuitement'}</button>
        <p className="mt-2 text-center text-[12.5px] text-[#B4C1D3]">Gratuit · relu par notre équipe avant publication · vos coordonnées restent confidentielles</p>
      </form>
    </main>
  );
}
