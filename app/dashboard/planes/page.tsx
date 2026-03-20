import { createClient } from '@/lib/supabase/server'
import PlanesClient from './PlanesClient'

export default async function PlanesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('users')
    .select('plan_id, billing_cycle, subscription_status, plan_expires_at')
    .eq('id', user!.id)
    .single()

  return (
    <PlanesClient
      initialData={{
        plan_id: data?.plan_id ?? 1,
        billing_cycle: data?.billing_cycle ?? 'monthly',
        subscription_status: data?.subscription_status ?? 'none',
        plan_expires_at: data?.plan_expires_at ?? null,
      }}
    />
  )
}
