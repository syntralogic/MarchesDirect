import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyVaultApi, type ApiCompanyDocument } from '@/lib/apiClient';

// « Mes documents » (5 nov.) : les pièces que demandent presque tous les dossiers, avec leur validité,
// affichées comme une banque affiche l'échéance d'une carte. Déposées une fois, réutilisées par Elena.
const ESSENTIELS: { type: string; label: string; days: number | null; hint: string }[] = [
  { type: 'kbis', label: 'Extrait Kbis', days: 90, hint: 'Valable 3 mois' },
  { type: 'attestation_sociale', label: 'Attestation de vigilance URSSAF', days: 180, hint: 'Valable 6 mois' },
  { type: 'attestation_fiscale', label: 'Attestation de régularité fiscale', days: null, hint: 'Date indiquée sur l’attestation' },
  { type: 'insurance', label: 'Assurance décennale', days: null, hint: 'Année en cours' },
];
const dayMs = 86400000;
function until(doc: ApiCompanyDocument, days: number | null): Date | null {
  if (doc.expiry_date) return new Date(doc.expiry_date);
  if (doc.issued_date && days) return new Date(new Date(doc.issued_date).getTime() + days * dayMs);
  return null;
}
type Tone = 'ok' | 'soon' | 'expired' | 'missing' | 'unknown';
const TONE: Record<Tone, string> = { ok: 'text-[#6EE7B7]', soon: 'text-[#FDBA74]', expired: 'text-[#FCA5A5]', missing: 'text-[#FCD34D]', unknown: 'text-[#B4C1D3]' };
const DOT: Record<Tone, string> = { ok: 'bg-[#34D399]', soon: 'bg-[#F97316]', expired: 'bg-[#EF4444]', missing: 'bg-[#F59E0B]', unknown: 'bg-[#4B5B70]' };

export default function DocumentsTab() {
  const [docs, setDocs] = useState<ApiCompanyDocument[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { companyVaultApi.documents.list().then(setDocs).catch(() => { setErr(true); setDocs([]); }); }, []);
  if (docs == null) return <p className="text-[14px] text-[#B4C1D3]">Chargement…</p>;
  const rows = ESSENTIELS.map(e => {
    const doc = docs.filter(d => d.document_type === e.type).sort((a, b) => String(b.issued_date || '').localeCompare(String(a.issued_date || '')))[0];
    let tone: Tone; let text: string;
    if (!doc) { tone = 'missing'; text = 'À déposer'; }
    else {
      const u = until(doc, e.days);
      if (doc.is_expired || (u && u.getTime() < Date.now())) { tone = 'expired'; text = 'Expiré : à renouveler'; }
      else if (!u) { tone = 'unknown'; text = 'Déposé · indiquez sa date de validité'; }
      else {
        const n = Math.ceil((u.getTime() - Date.now()) / dayMs);
        tone = n <= 30 ? 'soon' : 'ok';
        text = n <= 30 ? `Expire dans ${n} jour${n > 1 ? 's' : ''}` : `Valable jusqu’au ${u.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
    }
    return { e, tone, text };
  });
  const others = docs.filter(d => !ESSENTIELS.some(e => e.type === d.document_type));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13.5px] text-[#B4C1D3]">Déposez-les une fois : Elena les reprend dans chacun de vos dossiers, et vous voyez ici avant qu’ils expirent.</p>
      {err && <p className="text-[13px] text-[#FCA5A5]">Vos documents n’ont pas pu être chargés. Réessayez dans un instant.</p>}
      {rows.map(r => (
        <div key={r.e.type} className="flex items-center gap-3 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
          <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[r.tone]}`} />
          <div className="min-w-0 flex-1"><b className="block text-[14.5px] leading-tight">{r.e.label}</b><span className={`text-[12.5px] font-bold ${TONE[r.tone]}`}>{r.text}</span><span className="text-[12px] text-[#B4C1D3]"> · {r.e.hint}</span></div>
        </div>))}
      {others.length > 0 && <p className="text-[12.5px] text-[#B4C1D3]">Et {others.length} autre{others.length > 1 ? 's' : ''} document{others.length > 1 ? 's' : ''} déposé{others.length > 1 ? 's' : ''}.</p>}
      <Link to="/profil/dossier-entreprise" className="mt-1 flex min-h-[48px] items-center justify-center rounded-xl bg-[#F97316] text-[15px] font-extrabold text-white">Déposer ou mettre à jour un document</Link>
    </div>
  );
}
