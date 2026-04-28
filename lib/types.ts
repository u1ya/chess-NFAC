export type City = 'Almaty' | 'Astana' | 'Shymkent' | 'Karaganda' | 'Aktobe' | 'Other'

export interface Profile {
  id: string
  username: string
  city: City
  rating: number
  is_pro: boolean
  coach_score: number
  created_at: string
}

export type GameMode = 'friend' | 'bot' | 'local'
export type GameStatus = 'in_progress' | 'finished'
export type TimeControl = 'bullet' | 'blitz' | 'rapid'
export type BotDifficulty = 'beginner' | 'intermediate' | 'master'

export interface GameConfig {
  time_control: TimeControl
  time_seconds: number
  increment_seconds: number
  bot_difficulty?: BotDifficulty
  player_color?: 'white' | 'black' | 'random'
}

export interface Game {
  id: string
  mode: GameMode
  config: GameConfig
  pgn: string
  status: GameStatus
  winner_id: string | null
  white_id: string | null
  black_id: string | null
  room_code: string | null
  created_at: string
  updated_at: string
}

export interface AIReview {
  id: string
  game_id: string
  user_id: string
  review_text: string
  accuracy_percentage: number | null
  biggest_mistake: string | null
  created_at: string
}

export const TIME_CONTROLS: Record<TimeControl, { label: string; seconds: number; increment: number }> = {
  bullet: { label: 'Пуля 1+0', seconds: 60, increment: 0 },
  blitz: { label: 'Блиц 3+2', seconds: 180, increment: 2 },
  rapid: { label: 'Рапид 10+0', seconds: 600, increment: 0 },
}

export const BOT_DIFFICULTIES: Record<BotDifficulty, { label: string; depth: number; elo: number }> = {
  beginner: { label: 'Новичок', depth: 1, elo: 800 },
  intermediate: { label: 'Средний', depth: 5, elo: 1400 },
  master: { label: 'Мастер', depth: 15, elo: 2200 },
}

export const CITIES: City[] = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Other']
