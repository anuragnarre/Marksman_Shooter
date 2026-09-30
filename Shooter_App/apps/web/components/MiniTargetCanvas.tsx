const DEMO_SHOTS = [
  { x: 50.4, y: 49.2, score: 10.9 },
  { x: 49.1, y: 50.8, score: 10.7 },
  { x: 51.2, y: 48.6, score: 10.6 },
  { x: 48.8, y: 51.4, score: 10.4 },
]

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623'
  if (score >= 10)   return '#4FC3F7'
  if (score >= 9)    return '#00E5A0'
  return '#FF4D6D'
}

export function MiniTargetCanvas() {
  const toSVG = (c: number) => (c / 100) * 120
  return (
    <svg viewBox="0 0 120 120" className="w-full aspect-square max-w-[120px] mx-auto">
      {[50, 42, 34, 26, 18, 10, 4].map(r => (
        <circle key={r} cx="60" cy="60" r={r}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      ))}
      {[
        [60, 2, 60, 22], [60, 98, 60, 118],
        [2, 60, 22, 60], [98, 60, 118, 60],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(245,166,35,0.25)" strokeWidth="0.5" />
      ))}
      <circle cx="60" cy="60" r="1.2" fill="rgba(245,166,35,0.6)" />
      {DEMO_SHOTS.map((s, i) => (
        <circle key={i}
          cx={toSVG(s.x)} cy={toSVG(s.y)} r="3.5"
          fill={shotColor(s.score)}
          stroke="rgba(0,0,0,0.5)" strokeWidth="0.5"
          style={{ animation: `fadeUp 0.4s ease-out ${i * 150}ms both` }}
        />
      ))}
    </svg>
  )
}
