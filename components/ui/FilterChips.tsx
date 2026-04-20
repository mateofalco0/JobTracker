'use client'

type FilterValue = 'all' | 'active' | 'offers'

interface FilterChipsProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
}

const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'offers', label: 'Offers' },
]

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className="px-3 py-1.5 text-sm font-medium rounded-full active:scale-95 transition-all"
          style={
            value === f.value
              ? { background: '#3B9EFF', color: '#FFFFFF', minHeight: '32px' }
              : { background: '#1C1C1E', color: '#8E8E93', minHeight: '32px' }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
