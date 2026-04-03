export default function AmountBadge({ amount, size = 'sm' }) {
  const isPositive = amount >= 0
  const cls = size === 'lg'
    ? 'text-base font-medium tabular'
    : 'text-sm tabular'

  return (
    <span className={`${cls} ${isPositive ? 'text-income-text' : 'text-expense-text'}`}>
      {isPositive ? '+' : ''}
      {amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
    </span>
  )
}
