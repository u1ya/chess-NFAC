'use client'

import { useState, useEffect } from 'react'

interface ReviewResult {
  worst_move: string
  best_move: string
  advice: string
  accuracy: number | null
  // legacy field from DB (biggest_mistake → worst_move)
  biggest_mistake?: string
}

interface CoachSummaryProps {
  pgn: string
  gameId?: string
  isPro: boolean
  onUpgradeClick: () => void
  existingReview?: {
    biggest_mistake: string
    advice: string
    accuracy: number | null
  }
}

export default function CoachSummary({ pgn, gameId, isPro, onUpgradeClick, existingReview }: CoachSummaryProps) {
  const [review, setReview] = useState<ReviewResult | null>(
    existingReview
      ? {
          worst_move: existingReview.biggest_mistake,
          best_move: '',
          advice: existingReview.advice,
          accuracy: existingReview.accuracy,
        }
      : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (isPro) return
    fetch('/api/review')
      .then(r => r.json())
      .then(d => setRemaining(typeof d.remaining === 'number' ? d.remaining : 0))
      .catch(() => setRemaining(0))
  }, [isPro])

  async function requestReview() {
    const canUse = isPro || (remaining !== null && remaining > 0)
    if (!canUse) { onUpgradeClick(); return }

    setLoading(true)
    setError('')

    let res: Response
    try {
      res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn, gameId }),
      })
    } catch {
      setError('Нет соединения с сервером')
      setLoading(false)
      return
    }

    let data: Record<string, unknown> = {}
    try {
      const text = await res.text()
      if (text) data = JSON.parse(text)
    } catch {
      setError('Ошибка ответа сервера')
      setLoading(false)
      return
    }

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Ошибка анализа')
      if (!isPro && remaining === 0) onUpgradeClick()
    } else {
      setReview({
        worst_move: typeof data.worst_move === 'string' ? data.worst_move : '',
        best_move: typeof data.best_move === 'string' ? data.best_move : '',
        advice: typeof data.advice === 'string' ? data.advice : '',
        accuracy: typeof data.accuracy === 'number' ? data.accuracy : null,
      })
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
    }
    setLoading(false)
  }

  if (!pgn) return null

  const canAnalyze = isPro || (remaining !== null && remaining > 0)

  const buttonLabel = isPro
    ? 'Разбор партии'
    : remaining === null
      ? 'Разбор партии...'
      : remaining > 0
        ? `Разбор партии (осталось ${remaining})`
        : 'Разбор партии (лимит исчерпан)'

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 w-full"
      style={{ background: '#161616', border: '1px solid #2a2a2a' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: '#D4AF37' }}>
          AI Тренер
        </h3>
        {review?.accuracy != null && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums" style={{ color: '#D4AF37' }}>
              {review.accuracy}%
            </span>
            <span className="text-sm" style={{ color: '#888' }}>точность</span>
          </div>
        )}
      </div>

      {!review && !loading && (
        <button
          onClick={requestReview}
          className="w-full py-3 rounded-xl font-bold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: canAnalyze ? '#D4AF37' : 'transparent',
            color: canAnalyze ? '#000' : '#D4AF37',
            border: canAnalyze ? 'none' : '2px solid #D4AF37',
          }}
        >
          {buttonLabel}
        </button>
      )}

      {loading && (
        <div className="text-center py-4">
          <div
            className="inline-block w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
          />
          <p className="mt-2 text-sm" style={{ color: '#888' }}>Тренер анализирует партию...</p>
        </div>
      )}

      {error && <p className="text-sm text-center" style={{ color: '#e74c3c' }}>{error}</p>}

      {review && (
        <div className="flex flex-col gap-3">
          {review.worst_move && (
            <div
              className="rounded-xl p-4"
              style={{ background: '#0f0f0f', border: '1px solid #e74c3c33' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#e74c3c' }}>
                Слабый ход
              </p>
              <p className="text-sm leading-relaxed text-white">{review.worst_move}</p>
            </div>
          )}

          {review.best_move && (
            <div
              className="rounded-xl p-4"
              style={{ background: '#0f0f0f', border: '1px solid #4caf5033' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#4caf50' }}>
                Лучший ход
              </p>
              <p className="text-sm leading-relaxed text-white">{review.best_move}</p>
            </div>
          )}

          {review.advice && (
            <div
              className="rounded-xl p-4"
              style={{ background: '#0f0f0f', border: '1px solid #D4AF3733' }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#D4AF37' }}>
                Совет тренера
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{review.advice}</p>
            </div>
          )}

          {!isPro && remaining !== null && (
            <p className="text-xs text-center" style={{ color: '#555' }}>
              Бесплатных анализов сегодня осталось:{' '}
              <span style={{ color: '#D4AF37' }}>{remaining}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
