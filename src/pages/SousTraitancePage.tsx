import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTrades } from '@/hooks/use-trades';
import { useLang } from '@/contexts/LangContext';
import PageMeta from '@/components/common/PageMeta';

// Client audit (msg 1, point 2 / msg 5, point 1): "les liens du bas de
// l'accueil ouvrent encore d'autres pages, avec des filtres sur le côté...
// À corriger : une même page de résultats, avec les choix du visiteur déjà
// renseignés, quelle que soit son entrée." "Je cherche un chantier" used to
// render its own separate mission list (own city/département/métier
// filters, no région/nature/sort) - a third presentation alongside
// /parcours and /recherche. /recherche's filters are a strict superset, so
// that mode now hands off there with journey=subcontracting preset.
//
// "Je cherche un partenaire" is NOT part of this unification: it was never
// a results list to begin with (20 Sep client audit, point 7 - see the
// comment this page used to carry) - there's no partner directory, so it
// only ever showed an explanation + a link to publish a partner search.
// That's kept here as its own small page rather than folded into
// /recherche, which has nothing equivalent to redirect to.
export default function SousTraitancePage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trades = useTrades();
  const mode = searchParams.get('mode') === 'partenaire' ? 'partenaire' : 'chantier';
  const city = searchParams.get('city') || '';
  const dept = searchParams.get('department') || 'Tous';
  const sector = searchParams.get('sector') || 'Tous';

  useEffect(() => {
    if (mode !== 'chantier') return;
    if (sector !== 'Tous' && trades.length === 0) return;
    const params = new URLSearchParams();
    params.set('journey', 'subcontracting');
    if (city) params.set('city', city);
    if (dept !== 'Tous') params.set('department', dept);
    if (sector !== 'Tous') {
      const tradeId = trades.find(tr => tr.name === sector)?.id;
      if (tradeId) params.set('trade_id', tradeId);
    }
    navigate(`/recherche?${params.toString()}`, { replace: true });
  }, [navigate, mode, trades, city, dept, sector]);

  if (mode !== 'partenaire') return null;

  return (
    <div className="page-fade-in max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24">
      <PageMeta title="Sous-traitance BTP — Marchés Direct" description="Trouvez une mission de sous-traitance ou publiez un besoin de renfort partout en France. Mettez-vous en relation directement avec des entreprises du bâtiment." />

      <div className="mb-6">
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('subTag')}</span>
        <h1 className="text-xl md:text-3xl font-extrabold text-white mb-2">{t('subTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs md:text-sm leading-snug max-w-2xl">{t('subSub')}</p>
      </div>

      <div className="flex gap-1 mb-4 bg-[#061D32] border border-[#17334D] rounded-lg p-1 w-fit">
        <a href="/sous-traitance" className="px-4 py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-colors text-[#B9BBC8] hover:text-white">
          {t('subModeChantier')}
        </a>
        <span className="px-4 py-1.5 rounded-md text-[10px] md:text-xs font-semibold bg-orange text-white">
          {t('subModePartenaire')}
        </span>
      </div>

      <div className="text-center py-10 px-4 border border-[#17334D] rounded-2xl bg-[#061D32] max-w-2xl">
        <p className="text-[11px] text-[#B9BBC8] max-w-[46ch] mx-auto mb-3">
          {t('subPartnerExplain') || "Il n'existe pas encore d'annuaire de partenaires à parcourir. Publiez ce que vous recherchez (métier, secteur, disponibilité) : les entreprises intéressées vous contacteront directement."}
        </p>
        <a href="/parcours?type=sous-traitance" className="inline-block text-xs font-semibold text-white bg-orange px-4 py-2.5 rounded-lg hover:bg-orange/90 transition-colors">
          {t('subPartnerCta') || 'Publier ma recherche de partenaire →'}
        </a>
      </div>
    </div>
  );
}
