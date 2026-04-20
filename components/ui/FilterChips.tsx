'use client'

type FilterValue = 'all' | 'active' | 'offers'

interface FilterChipsProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
}

const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'active', label: 'ACTIVE' },
  { value: 'offers', label: 'OFFERS' },
]

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className="px-3 py-1.5 text-xs tracking-widest rounded transition-colors"
          style={
            value === f.value
              ? { background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', color: '#38bdf8' }
              : { background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', color: '#64748b' }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
