'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md w-52"
      style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)' }}
    >
      <Search size={12} style={{ color: '#38bdf8', opacity: 0.5, flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="SEARCH_"
        className="bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 w-full tracking-widest"
      />
    </div>
  )
}
