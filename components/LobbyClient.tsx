'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, GameMode, GameConfig, TimeControl, BotDifficulty } from '@/lib/types'
import { TIME_CONTROLS, BOT_DIFFICULTIES, CITIES } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { signOut } from '@/app/actions'
import AuthModal from './AuthModal'
import CityLeaderboard from './CityLeaderboard'

interface LobbyClientProps {
  user: { id: string; email?: string } | null
  profile: Profile | null
}

export default function LobbyClient({ user, profile }: LobbyClientProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [timeControl, setTimeControl] = useState<TimeControl>('blitz')
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('intermediate')
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | 'random'>('random')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function startGame() {
    if (!selectedMode) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const config = {
      time_control: timeControl,
      time_seconds: TIME_CONTROLS[timeControl].seconds,
      increment_seconds: TIME_CONTROLS[timeControl].increment,
      ...(selectedMode === 'bot' && { bot_difficulty: botDifficulty }),
      player_color: playerColor,
    }

    if (selectedMode === 'local') {
      router.push(`/game/local?tc=${timeControl}`)
      return
    }

    if (selectedMode === 'friend' && roomCodeInput) {
      const { data: existingGame } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', roomCodeInput.toUpperCase())
        .eq('status', 'in_progress')
        .single()

      if (existingGame) {
        const color = existingGame.white_id ? 'black' : 'white'
        if (user) {
          const colorField = color === 'white' ? 'white_id' : 'black_id'
          await supabase.from('games').update({ [colorField]: user.id }).eq('id', existingGame.id)
        }
        const existingTc = (existingGame.config as GameConfig).time_control ?? timeControl
        router.push(`/game/friend?id=${existingGame.id}&code=${existingGame.room_code}&color=${color}&tc=${existingTc}`)
        return
      } else {
        setError('Комната не найдена. Проверьте код.')
        setLoading(false)
        return
      }
    }

    const roomCode = selectedMode === 'friend'
      ? Math.random().toString(36).substring(2, 8).toUpperCase()
      : null

    const gameData: Record<string, unknown> = {
      mode: selectedMode,
      config,
      pgn: '',
      status: 'in_progress',
      room_code: roomCode,
    }

    const chosenColor = playerColor === 'random'
      ? (Math.random() > 0.5 ? 'white' : 'black')
      : playerColor

    if (user) {
      gameData[chosenColor === 'white' ? 'white_id' : 'black_id'] = user.id
    }

    const { data, error: dbError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single()

    if (dbError || !data) {
      if (selectedMode === 'bot') {
        router.push(`/game/bot?difficulty=${botDifficulty}&color=${chosenColor}&tc=${timeControl}`)
        return
      }
      setError('Ошибка создания игры')
      setLoading(false)
      return
    }

    if (selectedMode === 'bot') {
      router.push(`/game/bot?id=${data.id}&difficulty=${botDifficulty}&color=${chosenColor}&tc=${timeControl}`)
    } else if (selectedMode === 'friend') {
      router.push(`/game/friend?id=${data.id}&code=${data.room_code}&color=${chosenColor}&tc=${timeControl}`)
    }
    setLoading(false)
  }

  const modes: { id: GameMode; label: string; icon: string; desc: string }[] = [
    { id: 'friend', label: 'С другом', icon: '♟', desc: 'Игра по коду комнаты' },
    { id: 'bot', label: 'Тренировочный бот', icon: '🤖', desc: 'Против Stockfish AI' },
    { id: 'local', label: 'На одном устройстве', icon: '⚔', desc: 'Два игрока за одним столом' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">♛</span>
          <h1 className="text-xl font-bold" style={{ color: '#D4AF37' }}>ChessCoach Arena</h1>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <span className="text-sm" style={{ color: '#888' }}>{profile?.username ?? user.email}</span>
                {profile?.is_pro ? (
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3744' }}>
                    ★ PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#1e1e1e', color: '#555', border: '1px solid #2a2a2a' }}>
                    Free
                  </span>
                )}
                <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                  {profile?.rating ?? 1200}
                </span>
              </button>
              <button
                onClick={() => router.push('/pro')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3744' }}
              >
                {profile?.is_pro ? '✓ Pro' : 'Upgrade Pro'}
              </button>
              <form action={signOut}>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80" style={{ background: '#1e1e1e', color: '#888' }}>
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: '#D4AF37', color: '#000' }}
            >
              Войти
            </button>
          )}
          <button onClick={() => router.push('/rating')} className="px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80" style={{ background: '#1e1e1e', color: '#888' }}>
            Рейтинг
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Left: Mode Selection */}
        <div className="flex flex-col gap-6 flex-1">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white">Выбери режим игры</h2>
            <p className="text-sm" style={{ color: '#555' }}>Шахматная платформа с ИИ-тренером</p>
          </div>

          {/* Game Modes */}
          <div className="grid grid-cols-1 gap-3">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(prev => prev === mode.id ? null : mode.id)}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                style={{
                  background: selectedMode === mode.id ? '#1a1a0a' : '#161616',
                  border: `2px solid ${selectedMode === mode.id ? '#D4AF37' : '#2a2a2a'}`,
                }}
              >
                <span className="text-3xl">{mode.icon}</span>
                <div>
                  <p className="font-bold text-white">{mode.label}</p>
                  <p className="text-sm" style={{ color: '#666' }}>{mode.desc}</p>
                </div>
                {selectedMode === mode.id && (
                  <span className="ml-auto text-sm font-bold" style={{ color: '#D4AF37' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Config Panel */}
          {selectedMode && (
            <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
              {/* Time Control */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#666' }}>
                  Контроль времени
                </p>
                <div className="flex gap-2">
                  {(Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][]).map(([key, tc]) => (
                    <button
                      key={key}
                      onClick={() => setTimeControl(key)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: timeControl === key ? '#D4AF37' : '#1e1e1e',
                        color: timeControl === key ? '#000' : '#888',
                      }}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Difficulty */}
              {selectedMode === 'bot' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#666' }}>
                    Сложность бота
                  </p>
                  <div className="flex gap-2">
                    {(Object.entries(BOT_DIFFICULTIES) as [BotDifficulty, typeof BOT_DIFFICULTIES[BotDifficulty]][]).map(([key, diff]) => (
                      <button
                        key={key}
                        onClick={() => setBotDifficulty(key)}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: botDifficulty === key ? '#D4AF37' : '#1e1e1e',
                          color: botDifficulty === key ? '#000' : '#888',
                        }}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selection for bot */}
              {selectedMode === 'bot' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#666' }}>
                    Ваш цвет
                  </p>
                  <div className="flex gap-2">
                    {(['white', 'black', 'random'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setPlayerColor(c)}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: playerColor === c ? '#D4AF37' : '#1e1e1e',
                          color: playerColor === c ? '#000' : '#888',
                        }}
                      >
                        {c === 'white' ? '⬜ Белые' : c === 'black' ? '⬛ Чёрные' : '🎲 Случайно'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Room code for friend mode */}
              {selectedMode === 'friend' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#666' }}>
                    Присоединиться по коду (или оставь пустым для новой игры)
                  </p>
                  <input
                    type="text"
                    placeholder="Введи код комнаты..."
                    value={roomCodeInput}
                    onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm font-mono outline-none tracking-widest"
                    style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-center" style={{ color: '#e74c3c' }}>{error}</p>}

              <button
                onClick={startGame}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-black text-lg transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#D4AF37', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Загрузка...' : selectedMode === 'friend' && roomCodeInput ? 'Войти в комнату' : 'Начать игру'}
              </button>
            </div>
          )}
        </div>

        {/* Right: City Leaderboard */}
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <CityLeaderboard currentUserId={user?.id} />
        </div>
      </main>
    </div>
  )
}
