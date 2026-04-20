'use client'

import { Job } from '@/lib/types'

interface StatsBarProps {
  jobs: Job[]
}

export function StatsBar({ jobs }: StatsBarProps) {
  const total = jobs.length
  const interviews = jobs.filter(j => j.status === 'interviewing').length
  const offers = jobs.filter(j => j.status === 'offer').length
  const responded = jobs.filter(j => j.status !== 'applied').length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

  const stats = [
    { value: total,            label: 'TOTAL APPLICATIONS', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  icon: '◈' },
    { value: interviews,       label: 'ACTIVE INTERVIEWS',  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', icon: '◆' },
    { value: `${responseRate}%`, label: 'RESPONSE RATE',    color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  icon: '▲' },
    { value: offers,           label: 'OFFERS RECEIVED',    color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  icon: '★' },
  ]

  return (
    <div className="grid grid-cols-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4"
          style={{ borderRight: i < 3 ? '1px solid rgba(56,189,248,0.08)' : 'none' }}
        >
          <div
            className="w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0 text-base"
            style={{ background: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div>
            <div className="text-2xl font-bold leading-none" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs tracking-widest mt-1" style={{ color: '#475569' }}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
