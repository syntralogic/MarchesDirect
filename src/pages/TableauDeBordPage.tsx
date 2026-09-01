import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Calendar, Euro, AlertCircle, Sparkles, ArrowRight, ArrowLeft,
  Search, UserRound, ChevronRight, ClipboardCheck, FolderCheck, PhoneCall, Bookmark,
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { SaveButton } from '@/components/SaveButton';
import {
  apiClient, getApiErrorMessage, dashboardApi, favoritesApi, tendersApi,
  type ApiDashboardMatch, type ApiBidSummary,
} from '@/lib/apiClient';
import { apiOpportunityToDisplay } from '@/lib/opportunityAdapter';
import type { Opportunity } from '@/data/mockData';
import { AppointmentModal } from '@/components/AppointmentModal';

interface DashboardSummary {
  activeOpportunities: number;
  unreadAlerts: number;
  bidsByStatus: { status: string; count: string }[];
  validDocuments: number;
}

type Section = 'overview' | 'new' | 'saved' | 'dossiers';

const BID_STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  in_progress: 'En cours',
  submitted: 'Déposé',
  awarded: 'Gagné',
  lost: 'Perdu',
};

export default function TableauDeBordPage() {
  const { t } = useLang();
  const { user, company } = useAuth();
  const { savedIds } = useFavorites();
  const isPaid = company?.subscription_status === 'active';

  const [section, setSection] = useState<Section>('overview');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [matches, setMatches] = useState<ApiDashboardMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [bids, setBids] = useState<ApiBidSummary[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);

  const [savedList, setSavedList] = useState<Opportunity[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [showAccountManagerModal, setShowAccountManagerModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const { data } = await apiClient.get<DashboardSummary>('/dashboard');
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setStatsError(getApiErrorMessage(err, t('dashStatsLoadError')));
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    const loadMatches = async () => {
      setMatchesLoading(true);
      setMatchesError(null);
      try {
        const { matches: m } = await dashboardApi.matches();
        if (!cancelled) setMatches(m);
      } catch (err) {
        if (!cancelled) setMatchesError(getApiErrorMessage(err, t('dashMatchesError') || 'Impossible de charger vos opportunités recommandées.'));
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    };

    const loadBids = async () => {
      setBidsLoading(true);
      try {
        const rows = await tendersApi.myBids();
        if (!cancelled) setBids(rows);
      } catch {
        // Non-fatal: the "Dossiers" stat just shows 0 / the section shows
        // its own retry-free empty state rather than blocking the page.
      } finally {
        if (!cancelled) setBidsLoading(false);
      }
    };

    loadSummary();
    loadMatches();
    loadBids();
    return () => { cancelled = true; };
  }, [t]);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const results = await favoritesApi.list();
      setSavedList(results.map(apiOpportunityToDisplay));
      setSavedLoaded(true);
    } catch {
      // Section shows its own empty/error state below.
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const openSection = (s: Section) => {
    setSection(s);
    if (s === 'saved' && !savedLoaded) loadSaved();
  };

  const dossiersInProgress = bids.filter(b => b.status !== 'submitted' && b.status !== 'awarded' && b.status !== 'lost').length;
  const featured = matches[0];
  const firstName = user?.firstName || '';
  const companyName = company?.name || '';
  const initial = (firstName || companyName || '?').charAt(0).toUpperCase();

  return (
    <div className="page-fade-in max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-12">

      {/* HEADER */}
      {section === 'overview' ? (
        <div className="flex items-center gap-3 mb-6">
          <div className="shrink-0 w-11 h-11 rounded-full bg-orange text-white flex items-center justify-center font-extrabold text-lg">
            {initial}
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">{t('dashWelcome')}{firstName ? ` ${firstName}` : ''}</h1>
            <p className="text-xs text-[#B9BBC8]">{t('dashOverview')}</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSection('overview')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#B9BBC8] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> {t('dashBackToDashboard') || 'Retour au tableau de bord'}
        </button>
      )}

      {section === 'overview' && (
        <>
          {/* STATS */}
          {statsError ? (
            <div className="mb-6 bg-[#061D32] border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <p className="text-sm text-[#B9BBC8]">{statsError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <StatCard
                loading={statsLoading}
                value={summary?.activeOpportunities ?? 0}
                label={t('dashNewOpportunities') || 'Nouvelles opportunités'}
                onClick={() => openSection('new')}
              />
              <StatCard
                loading={statsLoading}
                value={savedIds.size}
                label={t('dashSaved') || 'Annonces enregistrées'}
                onClick={() => openSection('saved')}
              />
              <StatCard
                loading={bidsLoading}
                value={isPaid ? dossiersInProgress : bids.length}
                label={isPaid ? (t('dashDossiersInProgress') || 'Dossiers en cours') : (t('dashPendingRequests') || 'Demandes en cours')}
                onClick={() => openSection('dossiers')}
              />
            </div>
          )}

          {/* À NE PAS MANQUER */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange" />
              <h2 className="text-base font-bold text-white">{t('dashDontMiss') || 'À ne pas manquer'}</h2>
            </div>
            {matches.length > 1 && (
              <button type="button" onClick={() => openSection('new')} className="text-xs font-semibold text-orange hover:underline">
                {t('dashViewAll') || 'Voir tout'}
              </button>
            )}
          </div>

          {matchesLoading ? (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 mb-6">
              <div className="h-4 w-3/4 bg-[#17334D] rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-[#17334D] rounded animate-pulse" />
            </div>
          ) : matchesError ? (
            <div className="bg-[#061D32] border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 mb-6">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <p className="text-sm text-[#B9BBC8]">{matchesError}</p>
            </div>
          ) : !featured ? (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center mb-6">
              <Sparkles size={24} className="text-orange mx-auto mb-2" />
              <p className="text-sm font-semibold text-white mb-1">{t('dashNoMatches') || 'Aucune opportunité correspondante pour le moment.'}</p>
              <p className="text-xs text-[#B9BBC8]">{t('dashCompleteProfile') || 'Complétez votre profil entreprise pour améliorer vos recommandations.'}</p>
              <Link to="/profil/dossier-entreprise" className="inline-block mt-3 text-xs font-semibold text-orange hover:underline">
                {t('dashCompleteProfileLink') || 'Compléter mon profil →'}
              </Link>
            </div>
          ) : (
            <Link
              to={`/opportunites/${featured.id}`}
              className="block bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors mb-6"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-white leading-snug">{featured.title}</h3>
                <SaveButton opportunityId={featured.id} />
              </div>
              {featured.ai_summary && (
                <p className="text-xs text-[#B9BBC8] leading-relaxed mb-3 line-clamp-2">{featured.ai_summary}</p>
              )}
              <div className="flex flex-wrap gap-3 text-[11px] text-[#B9BBC8] mb-3">
                {(featured.location_city || featured.location_region) && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {featured.location_city || featured.location_region}</span>
                )}
                {featured.deadline && (
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(featured.deadline).toLocaleDateString('fr-FR')}</span>
                )}
                {featured.estimated_value && (
                  <span className="flex items-center gap-1"><Euro size={11} /> {new Intl.NumberFormat('fr-FR').format(featured.estimated_value)} €</span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange">
                {t('dashViewOpportunity') || 'Consulter cette opportunité'} <ArrowRight size={12} />
              </span>
            </Link>
          )}

          {/* FOLLOW-UP PANEL (tier-aware) */}
          {isPaid ? (
            <div className="space-y-3 mb-6">
              {bids.filter(b => b.status === 'draft' || b.status === 'in_progress').slice(0, 1).map(b => (
                <div key={b.id} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck size={18} className="text-orange shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white mb-1">{t('dashNextAction') || 'Prochaine action : compléter le dossier'}</p>
                      <p className="text-xs text-[#B9BBC8] mb-3">{b.title}</p>
                      <Link
                        to={`/opportunites/${b.opportunity_id}/candidature`}
                        className="inline-flex items-center gap-1.5 bg-orange text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors"
                      >
                        {t('dashContinueFile') || 'Continuer mon dossier'} <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <FolderCheck size={18} className="text-orange shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-1">
                      {t('dashCompanyFile') || 'Dossier entreprise'} : {statsLoading ? '…' : (summary?.validDocuments ?? 0)} {t('dashDocument') || 'pièce'}{(summary?.validDocuments ?? 0) > 1 ? 's' : ''} {t('dashValid') || 'valide'}{(summary?.validDocuments ?? 0) > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-[#B9BBC8] mb-3">{t('dashMemoReuse') || 'Le mémoire réutilise vos assurances, qualifications et références pour chaque candidature.'}</p>
                    <Link to="/profil/dossier-entreprise" className="inline-flex items-center gap-1.5 border border-[#17334D] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:border-orange/50 transition-colors">
                      {t('dashManageDocuments') || 'Gérer mes documents'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <PhoneCall size={18} className="text-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">{t('dashProfileActive') || 'Votre profil est actif'}</p>
                  <p className="text-xs text-[#B9BBC8] mb-3">{t('dashSaveOpportunities') || 'Enregistrez les annonces qui vous intéressent. Un chargé d\'affaires vous accompagne pour analyser les dossiers et préparer vos candidatures.'}</p>
                  <button
                    type="button"
                    onClick={() => setShowAccountManagerModal(true)}
                    className="inline-flex items-center gap-1.5 bg-orange text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors"
                  >
                    {t('dashViewPlans') || 'Contacter un chargé d\'affaires'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK LINKS */}
          <div className="mb-3">
            <h2 className="text-base font-bold text-white">{t('dashQuickLinks') || 'Accès rapides'}</h2>
          </div>
          <div className="space-y-2">
            <QuickLink to="/recherche" icon={Search} label={t('dashSearchOpportunities') || 'Rechercher d\'autres opportunités'} />
            <QuickLink to="/profil" icon={UserRound} label={t('dashViewProfile') || 'Voir et compléter mon profil'} />
          </div>
        </>
      )}

      {section === 'new' && (
        <SectionList
          title={t('dashNewOpportunities') || 'Nouvelles opportunités'}
          sub={t('dashNewSelection') || 'Une sélection correspondant à votre métier et votre zone.'}
          loading={matchesLoading}
          empty={matches.length === 0}
          emptyText={t('dashNoMatches') || 'Aucune opportunité correspondante pour le moment.'}
        >
          {matches.map(m => {
            const isPrivate = m.journey && m.journey !== 'public_procurement';
            const locked = isPrivate && !m.identity_unlocked;
            return (
              <div key={m.id} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
                <Link to={`/opportunites/${m.id}`} className="block mb-3">
                  <p className="text-sm font-bold text-white truncate">{m.title}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">
                    {[m.location_city, m.estimated_value ? `${new Intl.NumberFormat('fr-FR').format(m.estimated_value)} €` : null, m.deadline ? new Date(m.deadline).toLocaleDateString('fr-FR') : null].filter(Boolean).join(' · ')}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {locked ? (
                    <Link
                      to={`/opportunites/${m.id}`}
                      className="inline-flex items-center gap-1.5 bg-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors"
                    >
                      <PhoneCall size={12} /> {t('dashIdentityMaskedCta') || "Identité du donneur d'ordre masquée · Prendre rendez-vous pour déverrouiller"}
                    </Link>
                  ) : (
                    <Link
                      to={m.journey === 'public_procurement' ? `/opportunites/${m.id}` : `/opportunites/${m.id}/candidature`}
                      className="inline-flex items-center gap-1.5 bg-orange text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors"
                    >
                      <FolderCheck size={12} /> {m.journey === 'public_procurement' ? (t('dashPrepareFile') || 'Préparer mon dossier') : (t('dashViewPrivateFile') || 'Voir le dossier privé')}
                    </Link>
                  )}
                  <Link to={`/opportunites/${m.id}`} className="inline-flex items-center gap-1.5 border border-[#17334D] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                    <Sparkles size={12} /> {t('dashReviewAnalysis') || "Revoir l'analyse"}
                  </Link>
                </div>
              </div>
            );
          })}
        </SectionList>
      )}

      {section === 'saved' && (
        <SectionList
          title={t('dashSaved') || 'Annonces enregistrées'}
          sub={t('dashSavedSub') || 'Retrouvez ici toutes les opportunités mises de côté.'}
          loading={savedLoading}
          empty={savedList.length === 0}
          emptyText={t('dashSavedEmpty') || 'Aucune annonce enregistrée. Utilisez le cœur sur une fiche pour la retrouver ici.'}
          emptyIcon={Bookmark}
        >
          {savedList.map(o => (
            <Link
              key={o.id}
              to={`/opportunites/${o.id}`}
              className="flex items-center gap-3 bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{o.title}</p>
                <p className="text-xs text-[#B9BBC8] mt-0.5">{[o.location, o.amount, o.deadline ? new Date(o.deadline).toLocaleDateString('fr-FR') : null].filter(Boolean).join(' · ')}</p>
              </div>
              <ChevronRight size={16} className="text-[#B9BBC8] shrink-0" />
            </Link>
          ))}
        </SectionList>
      )}

      {section === 'dossiers' && (
        <SectionList
          title={isPaid ? (t('dashMyFiles') || 'Mes dossiers') : (t('dashMyRequests') || 'Mes demandes')}
          sub={t('dashBidsSub') || 'Suivez les candidatures et réponses en préparation.'}
          loading={bidsLoading}
          empty={bids.length === 0}
          emptyText={isPaid ? (t('dashNoBidsPaid') || "Aucun dossier en cours. Ouvrez une opportunité pour lancer l'analyse du DCE.") : (t('dashNoBidsFree') || "Aucune demande en cours. Passez à l'offre payante pour candidater.")}
        >
          {bids.map(b => (
            <Link
              key={b.id}
              to={`/opportunites/${b.opportunity_id}/candidature`}
              className="flex items-center gap-3 bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{b.title}</p>
                <p className="text-xs text-[#B9BBC8] mt-0.5">{BID_STATUS_LABEL[b.status] || b.status}{b.deadline ? ` · ${new Date(b.deadline).toLocaleDateString('fr-FR')}` : ''}</p>
              </div>
              <ChevronRight size={16} className="text-[#B9BBC8] shrink-0" />
            </Link>
          ))}
        </SectionList>
      )}

      <AppointmentModal open={showAccountManagerModal} onClose={() => setShowAccountManagerModal(false)} />
    </div>
  );
}

function StatCard({ loading, value, label, onClick }: { loading: boolean; value: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#061D32] border border-[#17334D] rounded-2xl p-3 text-left hover:border-orange/40 transition-colors"
    >
      {loading ? (
        <>
          <div className="h-6 w-8 bg-[#17334D] rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-[#17334D] rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-xl font-extrabold text-orange">{value}</p>
          <p className="text-[10px] font-medium text-[#B9BBC8] leading-tight mt-1">{label}</p>
        </>
      )}
    </button>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-3 hover:border-orange/40 transition-colors">
      <Icon size={16} className="text-orange shrink-0" />
      <span className="flex-1 text-sm font-semibold text-white">{label}</span>
      <ChevronRight size={16} className="text-[#B9BBC8] shrink-0" />
    </Link>
  );
}

function SectionList({
  title, sub, loading, empty, emptyText, emptyIcon: EmptyIcon = Sparkles, children,
}: {
  title: string; sub: string; loading: boolean; empty: boolean; emptyText: string;
  emptyIcon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-lg font-extrabold text-white mb-1">{title}</h1>
      <p className="text-xs text-[#B9BBC8] mb-4">{sub}</p>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
              <div className="h-4 w-3/4 bg-[#17334D] rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-[#17334D] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center">
          <EmptyIcon size={24} className="text-orange mx-auto mb-2" />
          <p className="text-sm text-[#B9BBC8]">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}