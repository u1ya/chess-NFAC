'use client'

import { useState } from 'react'
import type { Profile, City } from '@/lib/types'
import { CITIES } from '@/lib/types'

interface RatingPageClientProps {
  profiles: Profile[]
  currentUserId?: string
}

export default function RatingPageClient({ profiles, currentUserId }: RatingPageClientProps) {
  const [selectedCity, setSelectedCity] = useState<City | 'all'>('all')

  const filtered = selectedCity === 'all'
    ? profiles
    : profiles.filter(p => p.city === selectedCity)

  const currentUserRank = currentUserId
    ? filtered.findIndex(p => p.id === currentUserId) + 1
    : null

  const medalColors = ['#D4AF37', '#C0C0C0', '#CD7F32']
  const ratingColors = (rating: number) => {
    if (rating >= 2000) return '#e74c3c'
    if (rating >= 1600) return '#e67e22'
    if (rating >= 1400) return '#D4AF37'
    if (rating >= 1200) return '#2ecc71'
    return '#888'
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Current user rank */}
      {currentUserRank && currentUserRank > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: '#1a1a0a', border: '1px solid #D4AF3733' }}
        >
          <span className="text-3xl font-bold" style={{ color: '#D4AF37' }}>#{currentUserRank}</span>
          <div>
            <p className="text-sm font-bold text-white">Ваша позиция</p>
            <p className="text-xs" style={{ color: '#888' }}>
              {selectedCity === 'all' ? 'Глобальный рейтинг' : `Рейтинг в ${selectedCity}`}
            </p>
          </div>
        </div>
      )}

      {/* City Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCity('all')}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: selectedCity === 'all' ? '#D4AF37' : '#161616',
            color: selectedCity === 'all' ? '#000' : '#888',
            border: '1px solid #2a2a2a',
          }}
        >
          Все города
        </button>
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: selectedCity === city ? '#D4AF37' : '#161616',
              color: selectedCity === city ? '#000' : '#888',
              border: '1px solid #2a2a2a',
            }}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
        <div className="px-6 py-3 flex items-center gap-4" style={{ background: '#161616', borderBottom: '1px solid #2a2a2a' }}>
          <span className="w-8 text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>#</span>
          <span className="flex-1 text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Игрок</span>
          <span className="w-24 text-right text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Рейтинг</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#555' }}>
            Нет игроков в этом городе
          </div>
        ) : (
          filtered.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-4 px-6 py-4 transition-all hover:opacity-80"
              style={{
                background: player.id === currentUserId ? '#1a1a0a' : i % 2 === 0 ? '#0d0d0d' : '#0a0a0a',
                borderBottom: '1px solid #1a1a1a',
                borderLeft: player.id === currentUserId ? '3px solid #D4AF37' : '3px solid transparent',
              }}
            >
              <div className="w-8 flex items-center justify-center">
                {i < 3 ? (
                  <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                ) : (
                  <span className="text-sm font-bold" style={{ color: '#555' }}>{i + 1}</span>
                )}
              </div>

              <div className="flex-1 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: i < 3 ? medalColors[i] + '22' : '#1e1e1e',
                    color: i < 3 ? medalColors[i] : '#666',
                    border: `1px solid ${i < 3 ? medalColors[i] + '44' : '#333'}`,
                  }}
                >
                  {player.username[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {player.username}
                    {player.is_pro && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: '#D4AF3722', color: '#D4AF37' }}>PRO</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: '#555' }}>{player.city}</p>
                </div>
              </div>

              <div className="w-24 text-right">
                <span className="text-lg font-bold" style={{ color: ratingColors(player.rating) }}>
                  {player.rating}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
