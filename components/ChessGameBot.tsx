'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import CoachSummary from './CoachSummary'
import type { BotDifficulty, TimeControl } from '@/lib/types'
import { BOT_DIFFICULTIES, TIME_CONTROLS } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ChessGameBotProps {
  difficulty: BotDifficulty
  timeControl: TimeControl
  playerColor: 'white' | 'black'
  isPro: boolean
}

export default function ChessGameBot({ difficulty, timeControl, playerColor, isPro }: ChessGameBotProps) {
  const [game, setGame] = useState(new Chess())
  const [pgn, setPgn] = useState('')
  const [status, setStatus] = useState<'playing' | 'thinking' | 'finished'>('playing')
  const [result, setResult] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const router = useRouter()

  const botConfig = BOT_DIFFICULTIES[difficulty]
  const tc = TIME_CONTROLS[timeControl]
  const isPlayerTurn = useCallback(
    (g: Chess) => (playerColor === 'white' ? g.turn() === 'w' : g.turn() === 'b'),
    [playerColor]
  )

  useEffect(() => {
    const worker = new Worker('/stockfish.js')
    workerRef.current = worker
    worker.postMessage('uci')
    worker.postMessage(`setoption name Skill Level value ${botConfig.elo < 1000 ? 0 : botConfig.elo < 1600 ? 10 : 20}`)
    return () => worker.terminate()
  }, [botConfig.elo])

  const makeBotMove = useCallback((currentGame: Chess) => {
    if (!workerRef.current) return
    setStatus('thinking')

    const worker = workerRef.current
    const depth = botConfig.depth

    worker.onmessage = (e: MessageEvent) => {
      const line: string = e.data
      if (line.startsWith('bestmove')) {
        const parts = line.split(' ')
        const move = parts[1]
        if (!move || move === '(none)') { setStatus('finished'); return }

        setGame(prev => {
          const g = new Chess(prev.fen())
          g.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] ?? 'q' })
          setPgn(g.pgn())
          if (g.isGameOver()) {
            setStatus('finished')
            if (g.isCheckmate()) setResult(`Мат! Победили ${playerColor === 'white' ? 'Бот' : 'Вы'}`)
            else if (g.isDraw()) setResult('Ничья!')
            else setResult('Игра завершена')
          } else {
            setStatus('playing')
          }
          return g
        })
      }
    }

    worker.postMessage(`position fen ${currentGame.fen()}`)
    worker.postMessage(`go depth ${depth}`)
  }, [botConfig.depth, playerColor])

  useEffect(() => {
    if (status === 'playing' && !isPlayerTurn(game) && !game.isGameOver()) {
      const timer = setTimeout(() => makeBotMove(game), 800)
      return () => clearTimeout(timer)
    }
  }, [game, status, isPlayerTurn, makeBotMove])

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (status !== 'playing' || !isPlayerTurn(game)) return false

    const gameCopy = new Chess(game.fen())
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    if (!move) return false

    setPgn(gameCopy.pgn())

    if (gameCopy.isGameOver()) {
      setGame(gameCopy)
      setStatus('finished')
      if (gameCopy.isCheckmate()) setResult('Мат! Вы победили!')
      else if (gameCopy.isDraw()) setResult('Ничья!')
      else setResult('Игра завершена')
      return true
    }

    setGame(gameCopy)
    return true
  }

  function resetGame() {
    workerRef.current?.postMessage('stop')
    setGame(new Chess())
    setPgn('')
    setStatus('playing')
    setResult('')
  }

  const difficultyColor = difficulty === 'beginner' ? '#2ecc71' : difficulty === 'intermediate' ? '#f39c12' : '#e74c3c'

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#888' }}>
          {tc.label}
        </div>
        <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: difficultyColor + '22', color: difficultyColor, border: `1px solid ${difficultyColor}44` }}>
          {botConfig.label}
        </div>
        {status === 'thinking' && (
          <div className="px-4 py-2 rounded-xl text-sm font-medium animate-pulse" style={{ background: '#1e1e1e', color: '#D4AF37' }}>
            Бот думает...
          </div>
        )}
        {status === 'playing' && game.turn() === (playerColor === 'white' ? 'w' : 'b') && (
          <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#D4AF37' }}>
            Ваш ход
          </div>
        )}
        {game.isCheck() && (
          <div className="px-4 py-2 rounded-xl text-sm font-bold animate-pulse" style={{ background: '#e74c3c22', color: '#e74c3c', border: '1px solid #e74c3c44' }}>
            Шах!
          </div>
        )}
      </div>

      <div className="w-full max-w-[560px]">
        <Chessboard options={{
          position: game.fen(),
          onPieceDrop: ({ sourceSquare, targetSquare }) => targetSquare ? onDrop(sourceSquare, targetSquare) : false,
          boardOrientation: playerColor,
          boardStyle: { borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
          darkSquareStyle: { backgroundColor: '#4a7c59' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
          allowDragging: status === 'playing' && isPlayerTurn(game),
        }} />
      </div>

      {status === 'finished' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-[560px]">
          <div
            className="px-8 py-4 rounded-2xl text-xl font-bold text-center w-full"
            style={{ background: '#1e1e1e', color: '#D4AF37', border: '1px solid #D4AF3733' }}
          >
            {result}
          </div>
          <div className="flex gap-3">
            <button onClick={resetGame} className="px-6 py-3 rounded-xl font-bold" style={{ background: '#D4AF37', color: '#000' }}>
              Играть снова
            </button>
            <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-medium" style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}>
              В лобби
            </button>
          </div>
          <CoachSummary pgn={pgn} isPro={isPro} onUpgradeClick={() => router.push('/pro')} />
        </div>
      )}

      {status !== 'finished' && (
        <div className="flex gap-3">
          <button onClick={resetGame} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}>
            Новая игра
          </button>
          <button onClick={() => router.push('/')} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}>
            В лобби
          </button>
        </div>
      )}
    </div>
  )
}
