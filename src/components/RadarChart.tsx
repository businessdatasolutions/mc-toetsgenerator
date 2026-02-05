interface RadarChartProps {
  bet: number
  tech: number
  val: number
  size?: number
}

export default function RadarChart({
  bet,
  tech,
  val,
  size = 200,
}: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size * 0.4

  // Three axes at 120-degree intervals, starting from top
  // Top = Betrouwbaarheid, Bottom-right = Technisch, Bottom-left = Validiteit
  const axes = [
    { angle: -90, label: 'B', value: bet },
    { angle: 30, label: 'T', value: tech },
    { angle: 150, label: 'V', value: val },
  ]

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const getPoint = (angle: number, value: number) => ({
    x: cx + (value / 5) * maxRadius * Math.cos(toRad(angle)),
    y: cy + (value / 5) * maxRadius * Math.sin(toRad(angle)),
  })

  // Grid lines at score 1-5
  const gridLevels = [1, 2, 3, 4, 5]

  // Data polygon points
  const dataPoints = axes.map((a) => getPoint(a.angle, a.value))
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      role="img"
      aria-label={`Radardiagram: Betrouwbaarheid ${bet}, Technisch ${tech}, Validiteit ${val}`}
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const pts = axes
          .map((a) => {
            const p = getPoint(a.angle, level)
            return `${p.x},${p.y}`
          })
          .join(' ')
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        )
      })}

      {/* Axis lines */}
      {axes.map((a) => {
        const end = getPoint(a.angle, 5)
        return (
          <line
            key={a.label}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="#d1d5db"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPath}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3b82f6"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={axes[i].label}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="#3b82f6"
        />
      ))}

      {/* Labels */}
      {axes.map((a) => {
        const labelPoint = getPoint(a.angle, 6.2)
        return (
          <text
            key={a.label}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs font-medium fill-gray-600"
          >
            {a.label}
          </text>
        )
      })}
    </svg>
  )
}
