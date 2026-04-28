import { createClient } from '@/lib/supabase-server'
import ProfileClient from '@/components/ProfileClient'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { GameConfig } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  // Fetch finished games where user participated
  const { data: rawGames } = await supabase
    .from('games')
    .select('*')
    .or(`white_id.eq.${user.id},black_id.eq.${user.id}`)
    .eq('status', 'finished')
    .order('created_at', { ascending: false })
    .limit(30)

  const games = rawGames ?? []

  // Fetch opponent usernames for friend games
  const opponentIds = games
    .map(g => (g.white_id === user.id ? g.black_id : g.white_id))
    .filter((id): id is string => !!id && id !== user.id)
  const uniqueOpponentIds = [...new Set(opponentIds)]

  const { data: opponents } = uniqueOpponentIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', uniqueOpponentIds)
    : { data: [] }

  const opponentMap: Record<string, string> = Object.fromEntries(
    (opponents ?? []).map(p => [p.id, p.username])
  )

  // Fetch existing AI reviews for those games
  const gameIds = games.map(g => g.id)
  const { data: reviews } = gameIds.length > 0
    ? await supabase.from('ai_reviews').select('*').in('game_id', gameIds).eq('user_id', user.id)
    : { data: [] }

  const reviewMap: Record<string, { review_text: string; accuracy_percentage: number | null; biggest_mistake: string | null }> =
    Object.fromEntries((reviews ?? []).map(r => [r.game_id, r]))

  // Free reviews remaining today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: reviewsToday } = await supabase
    .from('ai_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
  const freeRemaining = profile.is_pro ? null : Math.max(0, 5 - (reviewsToday ?? 0))

  // Build game list with opponent names and config
  const gameList = games.map(g => {
    const opponentId = g.white_id === user.id ? g.black_id : g.white_id
    const config = g.config as GameConfig
    return {
      id: g.id,
      mode: g.mode as string,
      config,
      pgn: g.pgn as string,
      winner_id: g.winner_id as string | null,
      white_id: g.white_id as string | null,
      black_id: g.black_id as string | null,
      created_at: g.created_at as string,
      opponentName: opponentId ? (opponentMap[opponentId] ?? null) : null,
      existingReview: reviewMap[g.id] ?? null,
    }
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#888' }}>
          ← Лобби
        </Link>
        <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>Профиль</span>
      </header>
      <main className="flex flex-1 p-6 justify-center">
        <ProfileClient
          profile={profile}
          games={gameList}
          userId={user.id}
          freeRemaining={freeRemaining}
        />
      </main>
    </div>
  )
}
