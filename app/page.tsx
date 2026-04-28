import { createClient } from '@/lib/supabase-server'
import LobbyClient from '@/components/LobbyClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return <LobbyClient user={user} profile={profile} />
}
