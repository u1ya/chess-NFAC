import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChessCoach Arena',
  description: 'Шахматная платформа с городскими рейтингами и ИИ-тренером',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: '#0A0A0A', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
