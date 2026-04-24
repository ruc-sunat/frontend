import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user.id)
    .single()

  const planId = userData?.plan_id ?? 1

  return (
    <DashboardShell userEmail={user.email ?? ''} planId={planId}>
      {children}
    </DashboardShell>
  )
}
