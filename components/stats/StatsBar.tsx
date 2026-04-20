'use client'

import { Job } from '@/lib/types'

interface StatsBarProps {
  jobs: Job[]
}

export function StatsBar({ jobs }: StatsBarProps) {
  const total = jobs.length
  const interviews = jobs.filter(j => j.status === 'interviewing').length
  const offers = jobs.filter(j => j.status === 'offer').length
  const responseRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0

  const stats = [
    { value: total,              label: 'Applications',  bg: '#B8D4F0', text: '#1a3a5c' },
    { value: interviews,         label: 'Interviews',    bg: '#F5C896', text: '#5c3a0a' },
    { value: offers,             label: 'Offers',        bg: '#A8E6C0', text: '#0a3a1f' },
    { value: `${responseRate}%`, label: 'Response rate', bg: '#F0B8B8', text: '#5c1a1a' },
  ]

  return (
    <div className="px-4 pt-5 pb-2 md:px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{ background: stat.bg }}
          >
            <span className="text-3xl font-bold leading-none" style={{ color: stat.text }}>
              {stat.value}
            </span>
            <span className="text-xs font-semibold mt-0.5" style={{ color: stat.text, opacity: 0.65 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
