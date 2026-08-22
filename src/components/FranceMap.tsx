// Simplified France SVG map with major regions
export function FranceMap({ className = '', markers = true }: { className?: string; markers?: boolean }) {
  const locationDots = [
    { cx: 52, cy: 33, label: 'Île-de-France' },
    { cx: 56, cy: 57, label: 'Auvergne-Rhône-Alpes' },
    { cx: 50, cy: 17, label: 'Hauts-de-France' },
    { cx: 34, cy: 62, label: 'Nouvelle-Aquitaine' },
    { cx: 50, cy: 70, label: 'Occitanie' },
    { cx: 27, cy: 47, label: 'Pays de la Loire' },
    { cx: 65, cy: 30, label: 'Grand Est' },
    { cx: 65, cy: 72, label: "PACA" },
    { cx: 15, cy: 41, label: 'Bretagne' },
    { cx: 34, cy: 27, label: 'Normandie' },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Carte de France"
    >
      {/* France silhouette — simplified path */}
      <path
        d={`
          M 35 5
          L 42 3
          L 52 6
          L 60 4
          L 68 8
          L 74 14
          L 78 20
          L 80 28
          L 78 34
          L 82 38
          L 84 44
          L 80 50
          L 82 56
          L 80 62
          L 76 68
          L 72 74
          L 68 78
          L 62 80
          L 56 82
          L 50 80
          L 46 76
          L 40 74
          L 34 72
          L 28 68
          L 22 64
          L 18 58
          L 14 52
          L 12 46
          L 14 40
          L 10 36
          L 8 30
          L 10 24
          L 14 18
          L 20 12
          L 28 7
          Z
        `}
        fill="#0A2540"
        stroke="#17334D"
        strokeWidth="0.8"
      />

      {/* Internal region lines — horizontal & vertical approximations */}
      {/* Vertical dividers */}
      <line x1="42" y1="8" x2="40" y2="74" stroke="#17334D" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />
      <line x1="56" y1="6" x2="56" y2="82" stroke="#17334D" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />
      {/* Horizontal dividers */}
      <line x1="14" y1="40" x2="80" y2="40" stroke="#17334D" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />
      <line x1="10" y1="56" x2="80" y2="56" stroke="#17334D" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />
      <line x1="12" y1="24" x2="78" y2="24" stroke="#17334D" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />

      {/* Corsica */}
      <ellipse cx="88" cy="72" rx="4" ry="6" fill="#0A2540" stroke="#17334D" strokeWidth="0.5" opacity="0.8" />

      {/* Orange location dots */}
      {markers && locationDots.map((d, i) => (
        <g key={i}>
          <circle cx={d.cx} cy={d.cy} r="1.8" fill="#FF6500" opacity="0.9" />
          <circle cx={d.cx} cy={d.cy} r="3.5" fill="none" stroke="#FF6500" strokeWidth="0.5" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
}
