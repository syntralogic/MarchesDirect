// Percentage ring (spec 3.3). pct === null renders "—" (company and market not comparable yet: never a made-up %).
export default function ScoreRing({ pct, color, size = 96 }: { pct: number | null; color: string; size?: number }) {
  const C = 2 * Math.PI * 50;
  const val = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={pct === null ? 'Pourcentage à confirmer' : `Correspondance ${pct} pour cent`} className="shrink-0">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#1E3352" strokeWidth="12" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - val / 100)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .5s ease' }} />
      <text x="60" y="68" textAnchor="middle" fontSize="26" fontWeight="800" fill="#F2F5F9">{pct === null ? '—' : `${val} %`}</text>
    </svg>
  );
}
