// Punto de color por categoría — reemplaza los emojis en tablas
export const CATEGORY_COLORS = {
  'Vivienda':                '#185FA5',
  'Supermercado':            '#2599af',
  'Comida fuera y delivery': '#993C1D',
  'Ocio':                    '#7a46f4',
  'Transporte':              '#217d8f',
  'Mascotas':                '#854F0B',
  'Belleza':                 '#a93ed1',
  'Seguros y salud':         '#0F6E56',
  'Deudas':                  '#DC2626',
  'Ahorro':                  '#854F0B',
  'Envíos familia':          '#6a35de',
  'Lujo / Compras':          '#c555eb',
  'Sueldo':                  '#0F6E56',
  'Cuidado canino':          '#2599af',
  'Otros':                   '#9CA3AF',
}

export default function CategoryDot({ category, size = 8 }) {
  const color = CATEGORY_COLORS[category] ?? '#9CA3AF'
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
      title={category}
    />
  )
}
