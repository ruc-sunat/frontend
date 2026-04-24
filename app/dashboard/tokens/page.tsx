import { createClient } from '@/lib/supabase/server'
import TokensClient from './TokensClient'

export default async function TokensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: userData }, { data: tokens }] = await Promise.all([
    supabase.from('users').select('plan_id').eq('id', user!.id).single(),
    supabase.from('tokens').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
  ])

  return (
    <TokensClient
      initialTokens={tokens ?? []}
      planId={userData?.plan_id ?? 1}
      userId={user!.id}
    />
  )
}
