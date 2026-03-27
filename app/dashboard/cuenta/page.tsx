import { createClient } from '@/lib/supabase/server'
import CuentaClient from './CuentaClient'

export default async function CuentaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', user!.id)
    .single()

  return (
    <CuentaClient
      userEmail={userData?.email ?? user!.email!}
    />
  )
}
