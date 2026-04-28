import { createClient } from '@/lib/supabase-server'
import ChessGameFriend from '@/components/ChessGameFriend'
import type { TimeControl } from '@/lib/types'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function FriendGamePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; code?: string; color?: string; tc?: string }>
}) {
  const params = await searchParams
  const gameId = params.id
  const roomCode = params.code ?? ''
  const color = (params.color === 'black' ? 'black' : 'white') as 'white' | 'black'
  const timeControl = (params.tc ?? 'blitz') as TimeControl

  if (!gameId) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  if (user) {
    const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
    isPro = data?.is_pro ?? false
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#888' }}>
          ← Лобби
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#D4AF37' }}>
          Игра с другом
        </h1>
      </header>
      <main className="flex flex-1 items-start justify-center p-6 pt-10">
        <ChessGameFriend
          gameId={gameId}
          roomCode={roomCode}
          playerColor={color}
          timeControl={timeControl}
          isPro={isPro}
        />
      </main>
    </div>
  )
}
