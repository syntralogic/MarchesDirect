import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Wallet, Wrench, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { opportunitiesApi, getApiErrorMessage, type ApiOpportunityDetail } from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';
import { SaveButton } from '@/components/SaveButton';
import { TopBar, Eyebrow, PageTitle, Badge } from '@/components/sous-traitance/ui';

function formatAmount(value: number | null | undefined, currency: string | null | undefined, notCommunicatedLabel: string) {
  if (value === null || value === undefined) return notCommunicatedLabel;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' ' + (currency || 'EUR');
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

// Best-effort link to the original source record. raw_data's shape varies by
// connector (BOAMP/PLACE/TED); this checks the field names actually seen in
// practice rather than assuming one fixed schema.
function extractSourceUrl(raw: Record<string, any> | null | undefined): string | null {
  if (!raw) return null;
  const candidates = [raw.url, raw.source_url, raw.avis_url, raw.link, raw.notice_url, raw.uri];
  const found = candidates.find((v) => typeof v === 'string' && v.startsWith('http'));
  return found || null;
}

interface AnnonceDetailPageProps {
  journey: 'tender' | 'public_procurement';
  backHref: string;
}

export default function AnnonceDetailPage({ journey, backHref }: AnnonceDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setNotFound(false);

    opportunitiesApi
      .getById(id)
      .then((data) => {
        if (cancelled) return;
        setOpportunity(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getApiErrorMessage(err, String(t('detailLoadError'))));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  if (loading) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto pb-24">
        <TopBar backHref={backHref} />
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#B9BBC8]">
          <Loader2 size={22} className="animate-spin text-orange" />
          <p className="text-xs">Chargement...</p>
        </div>
      </div>
    );
  }

  if (notFound || (!opportunity && !loading)) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto pb-24">
        <TopBar backHref={backHref} />
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <AlertCircle size={22} className="text-orange" />
          <p className="text-sm text-white font-semibold">{t('detailNotFound')}</p>
          <Link to={backHref} className="text-xs text-orange font-semibold mt-1">
            {t('detailBack')}
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto pb-24">
        <TopBar backHref={backHref} />
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <AlertCircle size={22} className="text-orange" />
          <p className="text-sm text-white font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!opportunity) return null;

  const sourceUrl = extractSourceUrl(opportunity.raw_data);
  const matchedTrades = opportunity.ai_matched_trades ?? [];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 pb-24">
      <TopBar backHref={backHref} />

      <div className="flex items-start justify-between gap-3 mt-2 mb-1">
        <Eyebrow>{journey === 'tender' ? t('appelsTitle') : t('publicTitle')}</Eyebrow>
        <SaveButton opportunityId={opportunity.id} size="md" showLabel />
      </div>

      <PageTitle>{opportunity.title}</PageTitle>

      <div className="flex flex-wrap gap-2 mb-4">
        {opportunity.trade_name && <Badge tone="orange">{opportunity.trade_name.toUpperCase()}</Badge>}
        {opportunity.ai_classification_status === 'classified' && (
          <Badge tone="green">✓ {t('searchCompatible')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#B9BBC8] mb-1">
            <MapPin size={11} /> {t('detailLocation')}
          </div>
          <div className="text-[13px] font-bold text-white">
            {[opportunity.location_city, opportunity.location_region].filter(Boolean).join(', ') || '-'}
          </div>
        </div>
        <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#B9BBC8] mb-1">
            <Wallet size={11} /> {t('detailBudget')}
          </div>
          <div className="text-[13px] font-bold text-orange">
            {formatAmount(opportunity.estimated_value, opportunity.currency, 'Montant non communiqué')}
          </div>
        </div>
        <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#B9BBC8] mb-1">
            <Calendar size={11} /> {t('detailDeadline')}
          </div>
          <div className="text-[13px] font-bold text-white">{formatDate(opportunity.deadline, locale)}</div>
        </div>
        <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#B9BBC8] mb-1">
            <Wrench size={11} /> {t('detailTrade')}
          </div>
          <div className="text-[13px] font-bold text-white">{opportunity.trade_name || '-'}</div>
        </div>
      </div>

      <p className="text-[10px] text-[#B9BBC8] mb-5">
        {t('detailPublished')} {formatDate(opportunity.publication_date, locale)}
      </p>

      {opportunity.description && (
        <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
          <div className="mb-2 text-[15px] font-extrabold text-white">{t('detailDescriptionTitle')}</div>
          <p className="text-[13px] leading-relaxed text-[#B9BBC8] whitespace-pre-line">{opportunity.description}</p>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
        <div className="mb-2 text-[15px] font-extrabold text-white">{t('detailAiSummaryTitle')}</div>
        {opportunity.ai_summary ? (
          <p className="text-[13px] leading-relaxed text-[#B9BBC8]">{opportunity.ai_summary}</p>
        ) : (
          <p className="text-[12px] text-[#B9BBC8] italic">{t('detailAiSummaryPending')}</p>
        )}
      </div>

      {matchedTrades.length > 0 && (
        <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
          <div className="mb-2 text-[15px] font-extrabold text-white">{t('detailMatchedTradesTitle')}</div>
          <div className="flex flex-col gap-2">
            {matchedTrades.map((mt, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-white">{mt.trade_name || mt.trade_id}</span>
                <span className="text-orange font-semibold">{Math.round((mt.confidence ?? 0) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={15} className="text-orange" />
          <span className="text-[15px] font-extrabold text-white">{t('detailDocumentsTitle')}</span>
        </div>
        <p className="text-[12px] leading-relaxed text-[#B9BBC8] mb-3">{t('detailDocumentsNote')}</p>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-orange border border-orange/40 rounded-lg px-3 py-2 hover:bg-orange/10 transition-colors"
          >
            {t('detailSourceLink')} <ExternalLink size={12} />
          </a>
        ) : (
          <p className="text-[11px] text-[#6B7280] italic">{t('detailSourceMissing')}</p>
        )}
      </div>
    </div>
  );
}
