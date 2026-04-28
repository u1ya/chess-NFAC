'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Profile, City } from '@/lib/types'
import { CITIES } from '@/lib/types'

interface CityLeaderboardProps {
  currentUserId?: string
}

export default function CityLeaderboard({ currentUserId }: CityLeaderboardProps) {
  const [players, setPlayers] = useState<Profile[]>([])
  const [selectedCity, setSelectedCity] = useState<City | 'all'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('profiles')
        .select('*')
        .order('rating', { ascending: false })
        .limit(10)

      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity)
      }

      const { data } = await query
      setPlayers((data as Profile[]) ?? [])
      setLoading(false)
    }
    load()
  }, [selectedCity])

  const medalColors = ['#D4AF37', '#C0C0C0', '#CD7F32']

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#161616', border: '1px solid #2a2a2a', minWidth: 260 }}
    >
      <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>
        Городской рейтинг
      </h3>

      <select
        value={selectedCity}
        onChange={e => setSelectedCity(e.target.value as City | 'all')}
        className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
        style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
      >
        <option value="all">Все города</option>
        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {loading ? (
        <div className="text-center py-4 text-sm" style={{ color: '#555' }}>Загрузка...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-4 text-sm" style={{ color: '#555' }}>Нет игроков</div>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
              style={{
                background: player.id === currentUserId ? '#1a1a0a' : 'transparent',
                border: player.id === currentUserId ? '1px solid #D4AF3740' : '1px solid transparent',
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: i < 3 ? medalColors[i] + '22' : '#1f1f1f',
                  color: i < 3 ? medalColors[i] : '#666',
                  border: `1px solid ${i < 3 ? medalColors[i] + '44' : '#333'}`,
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{player.username}</p>
                <p className="text-xs" style={{ color: '#555' }}>{player.city}</p>
              </div>
              <span className="text-sm font-bold flex-shrink-0" style={{ color: '#D4AF37' }}>
                {player.rating}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
