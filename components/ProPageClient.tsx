'use client'

import { useState } from 'react'
import { activateProAccess } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface ProPageClientProps {
  isLoggedIn: boolean
  isPro: boolean
}

const features = [
  { icon: '🤖', title: 'Gemini AI Разбор', desc: 'Глубокий анализ каждой партии от ИИ-тренера' },
  { icon: '⚡', title: 'Blunder Puzzles', desc: 'Тренируй слабые места через позиционные задачи' },
  { icon: '📊', title: 'Продвинутая статистика', desc: 'Детальная аналитика точности ваших ходов' },
  { icon: '🏙', title: 'Городской рейтинг+', desc: 'Сезонные турниры по городам' },
  { icon: '♟', title: 'Мастер-уровень бота', desc: 'Доступ к Stockfish на максимальной глубине' },
  { icon: '💾', title: 'История партий', desc: 'Полный архив всех сыгранных партий' },
]

export default function ProPageClient({ isLoggedIn, isPro }: ProPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleActivate() {
    if (!isLoggedIn) { router.push('/'); return }
    setLoading(true)
    const result = await activateProAccess()
    if (result.success) {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 mx-auto px-4 py-2 rounded-full text-sm font-bold" style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3744' }}>
          ♛ ChessCoach Arena Pro
        </div>
        <h1 className="text-4xl font-bold text-white">
          Стань <span style={{ color: '#D4AF37' }}>Pro-игроком</span>
        </h1>
        <p className="text-lg" style={{ color: '#888' }}>
          Получи доступ к ИИ-тренеру и продвинутым инструментам анализа
        </p>
      </div>

      {/* Pricing Card */}
      <div
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{ background: '#161616', border: '2px solid #D4AF37' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5" style={{ background: '#D4AF37', transform: 'translate(30%, -30%)' }} />

        <div className="flex items-end gap-2 mb-2">
          <span className="text-5xl font-bold text-white">$9</span>
          <span className="text-xl mb-2" style={{ color: '#888' }}>/месяц</span>
        </div>
        <p className="text-sm mb-8" style={{ color: '#666' }}>Демо-прототип · Без реальной оплаты</p>

        {isPro ? (
          <div
            className="w-full py-4 rounded-2xl font-bold text-center text-xl"
            style={{ background: '#2ecc7122', color: '#2ecc71', border: '2px solid #2ecc7144' }}
          >
            ✓ У вас уже есть Pro-доступ!
          </div>
        ) : success ? (
          <div
            className="w-full py-4 rounded-2xl font-bold text-center text-xl animate-pulse"
            style={{ background: '#D4AF3722', color: '#D4AF37', border: '2px solid #D4AF3744' }}
          >
            ✓ Pro активирован! Перенаправление...
          </div>
        ) : (
          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-black text-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#D4AF37', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Активация...' : isLoggedIn ? '⚡ Активировать демо-доступ' : '⚡ Войти и активировать'}
          </button>
        )}

        {!isLoggedIn && (
          <p className="text-center text-sm mt-3" style={{ color: '#666' }}>
            Требуется аккаунт для активации
          </p>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(f => (
          <div
            key={f.title}
            className="rounded-2xl p-4 flex gap-3"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
          >
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div>
              <p className="font-bold text-white text-sm">{f.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#666' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Free vs Pro */}
      <div className="rounded-2xl p-6" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
        <h3 className="font-bold text-white mb-4">Free vs Pro</h3>
        <div className="flex flex-col gap-3">
          {[
            ['Все режимы игры', true, true],
            ['Городской рейтинг', true, true],
            ['Тренировочный бот', true, true],
            ['AI Разбор партии (Gemini)', false, true],
            ['Мастер-уровень Stockfish', false, true],
            ['Продвинутая статистика', false, true],
          ].map(([label, free, pro]) => (
            <div key={label as string} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#ccc' }}>{label as string}</span>
              <div className="flex gap-8">
                <span className="text-sm w-8 text-center" style={{ color: free ? '#2ecc71' : '#555' }}>
                  {free ? '✓' : '×'}
                </span>
                <span className="text-sm w-8 text-center" style={{ color: pro ? '#D4AF37' : '#555' }}>
                  {pro ? '✓' : '×'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-8 mt-3 pt-3" style={{ borderTop: '1px solid #222' }}>
          <span className="text-xs w-8 text-center" style={{ color: '#666' }}>Free</span>
          <span className="text-xs w-8 text-center font-bold" style={{ color: '#D4AF37' }}>Pro</span>
        </div>
      </div>
    </div>
  )
}
