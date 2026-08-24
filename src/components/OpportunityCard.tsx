import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, MapPin, Calendar, Building2, Target } from 'lucide-react';
import { useState } from 'react';
import type { Opportunity } from '@/data/mockData';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'En cours': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'Déposé': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'Gagné': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'Perdu': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-muted-foreground bg-muted/30 border-border';
  }
}

function getMatchColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-muted-foreground';
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [saved, setSaved] = useState(opportunity.saved);

  return (
    <div className="brand-card brand-border border rounded-xl p-4 hover:border-orange/40 transition-all duration-200 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {opportunity.category && (
            <span className="text-xs text-orange font-medium uppercase tracking-wide mb-1 block">
              {opportunity.category}
            </span>
          )}
          <h3 className="text-sm font-semibold text-brand-primary leading-snug line-clamp-2 group-hover:text-orange transition-colors">
            {opportunity.title}
          </h3>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-orange/10 transition-colors"
          aria-label={saved ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          {saved
            ? <BookmarkCheck size={16} className="text-orange" />
            : <Bookmark size={16} className="text-muted-foreground" />
          }
        </button>
      </div>

      {/* Organization */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 size={13} className="text-orange shrink-0" />
        <span className="text-xs text-brand-muted truncate">{opportunity.organization}</span>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{opportunity.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{opportunity.distance}</span>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-3 border-t brand-border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {/* Amount */}
          <div>
            <span className="text-xs text-muted-foreground">Montant : </span>
            <span className="text-xs font-medium text-brand-primary">{opportunity.amount}</span>
          </div>
          {/* Deadline */}
          <div className="flex items-center gap-1">
            <Calendar size={11} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(opportunity.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status */}
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(opportunity.status)}`}>
            {opportunity.status}
          </span>
          {/* Match */}
          <div className="flex items-center gap-1">
            <Target size={12} className={getMatchColor(opportunity.match)} />
            <span className={`text-xs font-semibold ${getMatchColor(opportunity.match)}`}>
              {opportunity.match}%
            </span>
          </div>
        </div>
      </div>

      {/* Ref */}
      {opportunity.ref && (
        <div className="mt-2 pt-2 border-t brand-border">
          <span className="text-xs text-muted-foreground font-mono">{opportunity.ref}</span>
        </div>
      )}
    </div>
  );
}

export function OpportunityCardSimple({ opportunity }: { opportunity: Opportunity }) {
  const [saved, setSaved] = useState(opportunity.saved);
  return (
    <Link
      to={`/${opportunity.type === 'public' ? 'marches-publics' : opportunity.type === 'private' ? 'appels-doffres' : 'sous-traitance'}/${opportunity.id}`}
      className="block brand-card brand-border border rounded-xl p-4 hover:border-orange/40 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {opportunity.category && (
            <span className="text-xs text-orange font-medium uppercase tracking-wide">{opportunity.category}</span>
          )}
          <h3 className="text-sm font-semibold text-brand-primary mt-0.5 line-clamp-2 group-hover:text-orange transition-colors">
            {opportunity.title}
          </h3>
        </div>
        <button onClick={e => { e.preventDefault(); setSaved(s => !s); }} className="shrink-0 p-1">
          {saved ? <BookmarkCheck size={14} className="text-orange" /> : <Bookmark size={14} className="text-muted-foreground" />}
        </button>
      </div>
      <p className="text-xs text-brand-muted mb-3">{opportunity.organization} · {opportunity.location}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(opportunity.status)}`}>{opportunity.status}</span>
        <span className={`text-xs font-semibold flex items-center gap-1 ${getMatchColor(opportunity.match)}`}>
          <Target size={11} /> {opportunity.match}%
        </span>
      </div>
    </Link>
  );
}
