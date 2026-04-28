'use client'

import { useState, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import CoachSummary from './CoachSummary'
import type { TimeControl } from '@/lib/types'
import { TIME_CONTROLS } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ChessGameLocalProps {
  timeControl: TimeControl
  isPro: boolean
}

export default function ChessGameLocal({ timeControl, isPro }: ChessGameLocalProps) {
  const [game, setGame] = useState(new Chess())
  const [boardFlip, setBoardFlip] = useState<'white' | 'black'>('white')
  const [pgn, setPgn] = useState('')
  const [status, setStatus] = useState<'playing' | 'finished'>('playing')
  const [result, setResult] = useState('')
  const router = useRouter()

  const tc = TIME_CONTROLS[timeControl]

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (status !== 'playing') return false
    const gameCopy = new Chess(game.fen())

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    })

    if (!move) return false

    setGame(gameCopy)
    setPgn(gameCopy.pgn())
    setBoardFlip(prev => prev === 'white' ? 'black' : 'white')

    if (gameCopy.isGameOver()) {
      setStatus('finished')
      if (gameCopy.isCheckmate()) {
        setResult(`Мат! Победили ${gameCopy.turn() === 'w' ? 'Чёрные' : 'Белые'}`)
      } else if (gameCopy.isDraw()) {
        setResult('Ничья!')
      } else {
        setResult('Игра завершена')
      }
    }

    return true
  }

  function resetGame() {
    setGame(new Chess())
    setPgn('')
    setStatus('playing')
    setResult('')
    setBoardFlip('white')
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-4">
        <div
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#1e1e1e', color: '#888' }}
        >
          {tc.label}
        </div>
        <div
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#1e1e1e', color: '#D4AF37' }}
        >
          {game.turn() === 'w' ? 'Ход Белых' : 'Ход Чёрных'}
        </div>
        {game.isCheck() && (
          <div
            className="px-4 py-2 rounded-xl text-sm font-bold animate-pulse"
            style={{ background: '#e74c3c22', color: '#e74c3c', border: '1px solid #e74c3c44' }}
          >
            Шах!
          </div>
        )}
      </div>

      <div className="w-full max-w-[560px]">
        <Chessboard options={{
          position: game.fen(),
          onPieceDrop: ({ sourceSquare, targetSquare }) => targetSquare ? onDrop(sourceSquare, targetSquare) : false,
          boardOrientation: boardFlip,
          boardStyle: { borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
          darkSquareStyle: { backgroundColor: '#4a7c59' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
        }} />
      </div>

      {status === 'playing' ? (
        <div className="flex gap-3">
          <button
            onClick={resetGame}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}
          >
            Новая игра
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}
          >
            В лобби
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-[560px]">
          <div
            className="px-8 py-4 rounded-2xl text-xl font-bold text-center w-full"
            style={{ background: '#1e1e1e', color: '#D4AF37', border: '1px solid #D4AF3733' }}
          >
            {result}
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ background: '#D4AF37', color: '#000' }}
            >
              Играть снова
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}
            >
              В лобби
            </button>
          </div>
          <CoachSummary
            pgn={pgn}
            isPro={isPro}
            onUpgradeClick={() => router.push('/pro')}
          />
        </div>
      )}
    </div>
  )
}
