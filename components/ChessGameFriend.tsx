'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { createClient } from '@/lib/supabase'
import { updateRatingsAfterGame } from '@/app/actions'
import CoachSummary from './CoachSummary'
import type { TimeControl } from '@/lib/types'
import { TIME_CONTROLS } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ChessGameFriendProps {
  gameId: string
  roomCode: string
  playerColor: 'white' | 'black'
  timeControl: TimeControl
  isPro: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ChessGameFriend({ gameId, roomCode, playerColor, timeControl, isPro }: ChessGameFriendProps) {
  const tc = TIME_CONTROLS[timeControl]
  const [game, setGame] = useState(new Chess())
  const [pgn, setPgn] = useState('')
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting')
  const [result, setResult] = useState('')
  const [whiteTime, setWhiteTime] = useState(tc.seconds)
  const [blackTime, setBlackTime] = useState(tc.seconds)
  const router = useRouter()
  const supabase = createClient()

  // Refs to avoid stale closures
  const gameRef = useRef<Chess>(new Chess())
  const statusRef = useRef<'waiting' | 'playing' | 'finished'>('waiting')
  const whiteTimeRef = useRef(tc.seconds)
  const blackTimeRef = useRef(tc.seconds)

  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { statusRef.current = status }, [status])

  const isMyTurn = useCallback(
    (g: Chess) => (playerColor === 'white' ? g.turn() === 'w' : g.turn() === 'b'),
    [playerColor]
  )

  // Initial fetch: check if opponent is already connected
  useEffect(() => {
    async function checkInitialState() {
      const { data } = await supabase.from('games').select('*').eq('id', gameId).single()
      if (!data) return

      if (data.pgn) {
        const g = new Chess()
        try { g.loadPgn(data.pgn) } catch { /* ignore */ }
        setGame(g)
        gameRef.current = g
        setPgn(data.pgn)
      }

      if (data.status === 'finished') {
        setStatus('finished')
        statusRef.current = 'finished'
        return
      }

      const opponentField = playerColor === 'white' ? 'black_id' : 'white_id'
      if ((data as Record<string, unknown>)[opponentField]) {
        setStatus('playing')
        statusRef.current = 'playing'
      }
    }
    checkInitialState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, playerColor])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, payload => {
        const updated = payload.new as {
          pgn: string
          status: string
          white_id: string | null
          black_id: string | null
        }

        const opponentField = playerColor === 'white' ? 'black_id' : 'white_id'
        if (updated[opponentField] && statusRef.current === 'waiting') {
          setStatus('playing')
          statusRef.current = 'playing'
        }

        const newGame = new Chess()
        if (updated.pgn) {
          try { newGame.loadPgn(updated.pgn) } catch { /* ignore */ }
        }
        setGame(newGame)
        gameRef.current = newGame
        setPgn(updated.pgn ?? '')

        if (updated.status === 'finished' && statusRef.current !== 'finished') {
          setStatus('finished')
          statusRef.current = 'finished'
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, playerColor])

  // Timer
  useEffect(() => {
    if (status !== 'playing') return

    const interval = setInterval(() => {
      if (statusRef.current !== 'playing') return

      const turn = gameRef.current.turn()

      if (turn === 'w') {
        const newTime = whiteTimeRef.current - 1
        whiteTimeRef.current = newTime
        setWhiteTime(newTime)

        if (newTime <= 0) {
          statusRef.current = 'finished'
          setStatus('finished')
          setResult('Время вышло! Победили Чёрные')
          supabase.from('games').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('id', gameId)
          // Only the winning player's client updates ratings
          if (playerColor === 'black') updateRatingsAfterGame(gameId, 'black')
        }
      } else {
        const newTime = blackTimeRef.current - 1
        blackTimeRef.current = newTime
        setBlackTime(newTime)

        if (newTime <= 0) {
          statusRef.current = 'finished'
          setStatus('finished')
          setResult('Время вышло! Победили Белые')
          supabase.from('games').update({ status: 'finished', updated_at: new Date().toISOString() }).eq('id', gameId)
          if (playerColor === 'white') updateRatingsAfterGame(gameId, 'white')
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, gameId, playerColor])

  async function onDrop(sourceSquare: string, targetSquare: string) {
    if (status !== 'playing' || !isMyTurn(game)) return false

    const gameCopy = new Chess(game.fen())
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    if (!move) return false

    // Apply increment
    if (tc.increment > 0) {
      if (playerColor === 'white') {
        const t = whiteTimeRef.current + tc.increment
        whiteTimeRef.current = t
        setWhiteTime(t)
      } else {
        const t = blackTimeRef.current + tc.increment
        blackTimeRef.current = t
        setBlackTime(t)
      }
    }

    const newPgn = gameCopy.pgn()
    setGame(gameCopy)
    gameRef.current = gameCopy
    setPgn(newPgn)

    const updateData: Record<string, unknown> = {
      pgn: newPgn,
      updated_at: new Date().toISOString(),
    }

    if (gameCopy.isGameOver()) {
      updateData.status = 'finished'
      setStatus('finished')
      statusRef.current = 'finished'

      if (gameCopy.isCheckmate()) {
        // I made the winning move, so I (playerColor) won
        setResult(`Мат! Победили ${playerColor === 'white' ? 'Белые' : 'Чёрные'}`)
        updateRatingsAfterGame(gameId, playerColor)
      } else if (gameCopy.isDraw()) {
        setResult('Ничья!')
      }
    }

    await supabase.from('games').update(updateData).eq('id', gameId)
    return true
  }

  const opponentColor = playerColor === 'white' ? 'black' : 'white'
  const myTime = playerColor === 'white' ? whiteTime : blackTime
  const opponentTime = playerColor === 'white' ? blackTime : whiteTime
  const myTurn = status === 'playing' && isMyTurn(game)

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#888' }}>
          {tc.label}
        </div>
        <div className="px-4 py-2 rounded-xl text-sm font-mono font-bold" style={{ background: '#D4AF3722', color: '#D4AF37', border: '1px solid #D4AF3744', letterSpacing: '0.1em' }}>
          Код: {roomCode}
        </div>
        {status === 'waiting' && (
          <div className="px-4 py-2 rounded-xl text-sm animate-pulse" style={{ background: '#1e1e1e', color: '#888' }}>
            Ожидание соперника...
          </div>
        )}
        {status === 'playing' && myTurn && (
          <div className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#D4AF37' }}>
            Ваш ход
          </div>
        )}
        {status === 'playing' && !myTurn && (
          <div className="px-4 py-2 rounded-xl text-sm animate-pulse" style={{ background: '#1e1e1e', color: '#888' }}>
            Ход соперника...
          </div>
        )}
        {status === 'playing' && game.isCheck() && (
          <div className="px-4 py-2 rounded-xl text-sm font-bold animate-pulse" style={{ background: '#e74c3c22', color: '#e74c3c', border: '1px solid #e74c3c44' }}>
            Шах!
          </div>
        )}
      </div>

      {/* Opponent timer */}
      <div className="w-full max-w-[560px] flex justify-end">
        <div
          className="px-5 py-2 rounded-xl text-xl font-mono font-bold tabular-nums"
          style={{
            background: status === 'playing' && !myTurn ? '#D4AF3722' : '#1e1e1e',
            color: status === 'playing' && !myTurn ? '#D4AF37' : '#444',
            border: `1px solid ${status === 'playing' && !myTurn ? '#D4AF3744' : '#2a2a2a'}`,
          }}
        >
          {opponentColor === 'white' ? '⬜' : '⬛'} {formatTime(opponentTime)}
        </div>
      </div>

      {/* Board */}
      <div className="w-full max-w-[560px]">
        <Chessboard options={{
          position: game.fen(),
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (targetSquare) onDrop(sourceSquare, targetSquare)
            return !!targetSquare
          },
          boardOrientation: playerColor,
          boardStyle: { borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
          darkSquareStyle: { backgroundColor: '#4a7c59' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
          allowDragging: status === 'playing' && isMyTurn(game),
        }} />
      </div>

      {/* My timer */}
      <div className="w-full max-w-[560px] flex justify-start">
        <div
          className="px-5 py-2 rounded-xl text-xl font-mono font-bold tabular-nums"
          style={{
            background: status === 'playing' && myTurn ? '#D4AF3722' : '#1e1e1e',
            color: status === 'playing' && myTurn ? '#D4AF37' : '#444',
            border: `1px solid ${status === 'playing' && myTurn ? '#D4AF3744' : '#2a2a2a'}`,
          }}
        >
          {playerColor === 'white' ? '⬜' : '⬛'} {formatTime(myTime)}
        </div>
      </div>

      {status === 'finished' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-[560px]">
          <div
            className="px-8 py-4 rounded-2xl text-xl font-bold text-center w-full"
            style={{ background: '#1e1e1e', color: '#D4AF37', border: '1px solid #D4AF3733' }}
          >
            {result || 'Игра завершена'}
          </div>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-bold" style={{ background: '#D4AF37', color: '#000' }}>
            В лобби
          </button>
          <CoachSummary pgn={pgn} gameId={gameId} isPro={isPro} onUpgradeClick={() => router.push('/pro')} />
        </div>
      )}

      {status !== 'finished' && (
        <button onClick={() => router.push('/')} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#1e1e1e', color: '#888', border: '1px solid #2a2a2a' }}>
          Покинуть игру
        </button>
      )}
    </div>
  )
}
