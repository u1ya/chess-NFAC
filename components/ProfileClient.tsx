'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CoachSummary from './CoachSummary'
import type { Profile, GameConfig } from '@/lib/types'

interface GameEntry {
  id: string
  mode: string
  config: GameConfig
  pgn: string
  winner_id: string | null
  white_id: string | null
  black_id: string | null
  created_at: string
  opponentName: string | null
  existingReview: {
    review_text: string
    accuracy_percentage: number | null
    biggest_mistake: string | null
  } | null
}

interface ProfileClientProps {
  profile: Profile
  games: GameEntry[]
  userId: string
  freeRemaining: number | null
}

function getResult(game: GameEntry, userId: string): { label: string; color: string } {
  if (!game.winner_id) return { label: 'Ничья', color: '#888' }
  if (game.winner_id === userId) return { label: 'Победа', color: '#4caf50' }
  return { label: 'Поражение', color: '#e74c3c' }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProfileClient({ profile, games, userId, freeRemaining }: ProfileClientProps) {
  const [expandedGame, setExpandedGame] = useState<string | null>(null)
  const router = useRouter()

  const winCount = games.filter(g => g.winner_id === userId).length
  const lossCount = games.filter(g => g.winner_id && g.winner_id !== userId).length
  const drawCount = games.filter(g => !g.winner_id).length

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Profile card */}
      <div
        className="rounded-2xl p-6 flex items-center gap-6"
        style={{ background: '#161616', border: '1px solid #2a2a2a' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0"
          style={{ background: '#D4AF3722', border: '2px solid #D4AF3744', color: '#D4AF37' }}
        >
          {profile.username[0].toUpperCase()}
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white truncate">{profile.username}</h2>
            {profile.is_pro ? (
              <span
                className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0"
                style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3744' }}
              >
                ★ PRO
              </span>
            ) : (
              <button
                onClick={() => router.push('/pro')}
                className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: '#1e1e1e', color: '#555', border: '1px solid #2a2a2a' }}
              >
                Free
              </button>
            )}
          </div>
          <p className="text-sm" style={{ color: '#666' }}>{profile.city}</p>
          <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>{profile.rating} <span className="text-sm font-normal" style={{ color: '#555' }}>рейтинг</span></p>
        </div>

        <div className="flex flex-col gap-1 text-right flex-shrink-0">
          <div className="text-sm font-medium" style={{ color: '#4caf50' }}>{winCount} W</div>
          <div className="text-sm font-medium" style={{ color: '#e74c3c' }}>{lossCount} L</div>
          <div className="text-sm font-medium" style={{ color: '#888' }}>{drawCount} D</div>
        </div>
      </div>

      {/* Free analyses banner */}
      {!profile.is_pro && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: '#0f1a0f', border: '1px solid #D4AF3733' }}
        >
          <span className="text-sm" style={{ color: '#ccc' }}>
            Бесплатных анализов сегодня: <span className="font-bold" style={{ color: '#D4AF37' }}>{freeRemaining ?? 0}</span> / 5
          </span>
          <button
            onClick={() => router.push('/pro')}
            className="text-xs font-bold px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: '#D4AF37', color: '#000' }}
          >
            Pro — безлимит
          </button>
        </div>
      )}

      {/* Game history */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white">История партий</h3>

        {games.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: '#555' }}>Ещё нет сыгранных партий</p>
        )}

        {games.map(game => {
          const result = getResult(game, userId)
          const myColor = game.white_id === userId ? 'white' : 'black'
          const isExpanded = expandedGame === game.id
          const hasReview = !!game.existingReview

          return (
            <div
              key={game.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            >
              {/* Game row */}
              <button
                className="w-full flex items-center gap-4 p-4 text-left transition-opacity hover:opacity-80"
                onClick={() => setExpandedGame(isExpanded ? null : game.id)}
              >
                {/* Result indicator */}
                <div
                  className="w-2 h-10 rounded-full flex-shrink-0"
                  style={{ background: result.color }}
                />

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: result.color }}>{result.label}</span>
                    <span className="text-xs" style={{ color: '#555' }}>•</span>
                    <span className="text-xs" style={{ color: '#555' }}>
                      {myColor === 'white' ? '⬜' : '⬛'} {myColor === 'white' ? 'Белые' : 'Чёрные'}
                    </span>
                    {game.mode === 'friend' && game.opponentName && (
                      <>
                        <span className="text-xs" style={{ color: '#555' }}>vs</span>
                        <span className="text-xs font-medium text-white">{game.opponentName}</span>
                      </>
                    )}
                    {game.mode === 'bot' && (
                      <span className="text-xs" style={{ color: '#555' }}>vs 🤖 Бот</span>
                    )}
                    {game.mode === 'local' && (
                      <span className="text-xs" style={{ color: '#555' }}>Локальная игра</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#555' }}>{formatDate(game.created_at)}</span>
                    {game.config.time_control && (
                      <span className="text-xs" style={{ color: '#555' }}>• {game.config.time_control}</span>
                    )}
                    {hasReview && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#D4AF3722', color: '#D4AF37' }}>
                        AI анализ
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs flex-shrink-0" style={{ color: '#555' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded: CoachSummary */}
              {isExpanded && game.pgn && (
                <div className="px-4 pb-4">
                  <CoachSummary
                    pgn={game.pgn}
                    gameId={game.id}
                    isPro={profile.is_pro}
                    onUpgradeClick={() => router.push('/pro')}
                    existingReview={
                      game.existingReview
                        ? {
                            biggest_mistake: game.existingReview.biggest_mistake ?? 'Не указано',
                            advice: game.existingReview.review_text,
                            accuracy: game.existingReview.accuracy_percentage,
                          }
                        : undefined
                    }
                  />
                </div>
              )}

              {isExpanded && !game.pgn && (
                <p className="px-4 pb-4 text-sm" style={{ color: '#555' }}>PGN партии недоступен</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
