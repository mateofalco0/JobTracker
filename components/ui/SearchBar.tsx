'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 rounded-xl flex-1 md:flex-none md:w-48"
      style={{ background: '#1C1C1E', minHeight: '40px' }}
    >
      <Search size={14} style={{ color: '#636366', flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search"
        className="bg-transparent text-sm text-white outline-none placeholder:text-[#636366] w-full"
      />
    </div>
  )
}
