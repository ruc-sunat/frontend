import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'

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

  // Fetch user plan
  const { data: userData } = await supabase
    .from('users')
    .select('plan_id')
    .eq('id', user.id)
    .single()

  const planId = userData?.plan_id ?? 1

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userEmail={user.email ?? ''} planId={planId} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
