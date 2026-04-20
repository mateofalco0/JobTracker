import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { redirect } from 'next/navigation'
import { Job } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to load jobs:', error.message)
  }

  return (
    <KanbanBoard
      initialJobs={(jobs ?? []) as Job[]}
      userEmail={user.email ?? ''}
      userId={user.id}
    />
  )
}
