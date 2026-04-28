import { createClient } from '@/lib/supabase-server'
import ChessGameBot from '@/components/ChessGameBot'
import type { BotDifficulty, TimeControl } from '@/lib/types'
import Link from 'next/link'

export default async function BotGamePage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; color?: string; tc?: string; id?: string }>
}) {
  const params = await searchParams
  const difficulty = (params.difficulty ?? 'intermediate') as BotDifficulty
  const color = (params.color === 'black' ? 'black' : 'white') as 'white' | 'black'
  const timeControl = (params.tc ?? 'blitz') as TimeControl

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  if (user) {
    const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
    isPro = data?.is_pro ?? false
  }

  const difficultyLabels = { beginner: 'Новичок', intermediate: 'Средний', master: 'Мастер' }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#888' }}>
          ← Лобби
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#D4AF37' }}>
          Тренировочный бот — {difficultyLabels[difficulty]}
        </h1>
      </header>
      <main className="flex flex-1 items-start justify-center p-6 pt-10">
        <ChessGameBot
          difficulty={difficulty}
          timeControl={timeControl}
          playerColor={color}
          isPro={isPro}
        />
      </main>
    </div>
  )
}
