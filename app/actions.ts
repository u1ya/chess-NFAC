'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { GameMode, GameConfig, City } from '@/lib/types'

export async function signUp(email: string, password: string, username: string, city: City) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, city } },
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}

export async function activateProAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Требуется авторизация' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/pro')
  return { success: true }
}

export async function createGame(mode: GameMode, config: GameConfig) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const roomCode = mode === 'friend'
    ? Math.random().toString(36).substring(2, 8).toUpperCase()
    : null

  const gameData: Record<string, unknown> = {
    mode,
    config,
    pgn: '',
    status: 'in_progress',
    room_code: roomCode,
  }

  if (user) {
    const playerColor = config.player_color === 'random'
      ? (Math.random() > 0.5 ? 'white' : 'black')
      : (config.player_color ?? 'white')
    if (playerColor === 'white') gameData.white_id = user.id
    else gameData.black_id = user.id
  }

  const { data, error } = await supabase
    .from('games')
    .insert(gameData)
    .select()
    .single()

  if (error) return { error: error.message }
  return { game: data }
}

export async function updateGamePgn(gameId: string, pgn: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('games')
    .update({ pgn, updated_at: new Date().toISOString() })
    .eq('id', gameId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function finishGame(gameId: string, winnerId: string | null, pgn: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('games')
    .update({
      status: 'finished',
      winner_id: winnerId,
      pgn,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateRatingsAfterGame(gameId: string, winnerColor: 'white' | 'black') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Требуется авторизация' }

  const { data: game } = await supabase
    .from('games')
    .select('white_id, black_id, winner_id, mode')
    .eq('id', gameId)
    .single()

  if (!game) return { error: 'Игра не найдена' }
  if (game.mode !== 'friend') return { error: 'Рейтинг обновляется только в играх с другом' }
  // Idempotency: if winner_id already set, ratings were already updated
  if (game.winner_id) return { success: true }

  const winnerId = winnerColor === 'white' ? game.white_id : game.black_id
  const loserId = winnerColor === 'white' ? game.black_id : game.white_id
  if (!winnerId || !loserId) return { error: 'Неполные данные игры' }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, rating')
    .in('id', [winnerId, loserId])

  if (!profiles || profiles.length < 2) return { error: 'Профили не найдены' }

  const winner = profiles.find(p => p.id === winnerId)!
  const loser = profiles.find(p => p.id === loserId)!

  const K = 32
  const expected = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400))
  const delta = Math.max(1, Math.round(K * (1 - expected)))

  await Promise.all([
    supabase.from('profiles').update({ rating: winner.rating + delta }).eq('id', winnerId),
    supabase.from('profiles').update({ rating: Math.max(100, loser.rating - delta) }).eq('id', loserId),
    supabase.from('games').update({ winner_id: winnerId }).eq('id', gameId),
  ])

  return { success: true, delta }
}

export async function saveAIReview(
  gameId: string,
  reviewText: string,
  accuracyPercentage: number | null,
  biggestMistake: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Требуется авторизация' }

  const { error } = await supabase
    .from('ai_reviews')
    .upsert({
      game_id: gameId,
      user_id: user.id,
      review_text: reviewText,
      accuracy_percentage: accuracyPercentage,
      biggest_mistake: biggestMistake,
    })

  if (error) return { error: error.message }
  return { success: true }
}
