import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { weeklyData } from '../../data/sampleData'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const labels = { ingresos: 'Ingresos', gastos: 'Gastos', ahorro: 'Ahorro' }
  return (
    <div className="bg-white border border-border rounded-lg shadow-card-md px-4 py-3 text-sm min-w-[160px]">
      <p className="font-medium text-primary mb-2 text-xs">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4 text-xs">
          <span style={{ color: p.color }}>{labels[p.name] ?? p.name}</span>
          <span className="font-medium text-primary tabular">
            {p.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      ))}
    </div>
  )
}

function CustomLegend({ payload }) {
  const labels = { ingresos: 'Ingresos', gastos: 'Gastos', ahorro: 'Ahorro' }
  return (
    <div className="flex gap-4 justify-end mt-1">
      {payload.map(p => (
        <div key={p.value} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-xs text-muted">{labels[p.value] ?? p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function WeeklyChart() {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card px-5 py-5">
      <p className="text-sm font-medium text-primary mb-4">Flujo semanal</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyData} barCategoryGap="35%" barGap={3}>
          <CartesianGrid vertical={false} stroke="#E2EEF1" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#8aa8af' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8aa8af' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}€`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eaf8fb', radius: 4 }} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="ingresos" fill="#059669"  radius={[3, 3, 0, 0]} />
          <Bar dataKey="gastos"   fill="#DC2626"  radius={[3, 3, 0, 0]} />
          <Bar dataKey="ahorro"   fill="#7a46f4"  radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
