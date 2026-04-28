'use client'

import { useState } from 'react'
import { signIn, signUp } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { CITIES } from '@/lib/types'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('Almaty')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
      else { router.refresh(); onClose() }
    } else {
      const result = await signUp(email, password, username, city as never)
      if (result.error) setError(result.error)
      else { router.refresh(); onClose() }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#D4AF37' }}>
          {mode === 'login' ? 'Войти' : 'Регистрация'}
        </h2>

        <div className="flex gap-2 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mode === m ? '#D4AF37' : '#222',
                color: mode === m ? '#000' : '#888',
              }}
            >
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
              />
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
            style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
            style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}
          />

          {error && (
            <p className="text-sm text-center" style={{ color: error.includes('email') ? '#D4AF37' : '#e74c3c' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-black transition-opacity"
            style={{ background: '#D4AF37', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
