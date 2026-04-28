import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase-server'

async function getUsedToday(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('ai_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
  return count ?? 0
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ remaining: 0 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  if (profile?.is_pro) return Response.json({ remaining: null, isPro: true })

  const used = await getUsedToday(supabase, user.id)
  return Response.json({ remaining: Math.max(0, 5 - used) })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  if (!profile?.is_pro) {
    const used = await getUsedToday(supabase, user.id)
    if (used >= 5) {
      return Response.json(
        { error: 'Дневной лимит (5 анализов) исчерпан. Upgrade до Pro для безлимитного доступа.' },
        { status: 403 }
      )
    }
  }

  let pgn: string | undefined
  let gameId: string | undefined
  try {
    const body = await request.json()
    pgn = body.pgn
    gameId = body.gameId
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  if (!pgn) {
    return Response.json({ error: 'PGN не предоставлен' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Gemini API не настроен' }, { status: 500 })
  }

  const prompt = `Ты — дружелюбный шахматный тренер. Проанализируй партию в PGN и дай краткий, понятный разбор на русском языке.

PGN:
${pgn}

Оцени в общих чертах, без движкового анализа. Ответь ТОЛЬКО валидным JSON (без markdown, без \`\`\`), вот так:
{"worst_move":"название хода и краткое объяснение почему плохо (1-2 предложения)","best_move":"название лучшего хода партии и почему он хорош (1-2 предложения)","advice":"общий совет по итогам партии (2-3 предложения)","accuracy":число от 0 до 100 — грубая субъективная оценка точности игры}`

  let reviewData = {
    worst_move: '',
    best_move: '',
    advice: '',
    accuracy: null as number | null,
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Strip markdown code fences if Gemini adds them
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      reviewData = {
        worst_move: typeof parsed.worst_move === 'string' ? parsed.worst_move : '',
        best_move: typeof parsed.best_move === 'string' ? parsed.best_move : '',
        advice: typeof parsed.advice === 'string' ? parsed.advice : '',
        accuracy: typeof parsed.accuracy === 'number' ? Math.min(100, Math.max(0, parsed.accuracy)) : null,
      }
    }
  } catch (err) {
    console.error('Gemini error:', err)
    return Response.json({ error: 'Ошибка AI анализа, попробуйте позже' }, { status: 500 })
  }

  if (gameId) {
    await supabase.from('ai_reviews').upsert({
      game_id: gameId,
      user_id: user.id,
      review_text: reviewData.advice,
      accuracy_percentage: reviewData.accuracy,
      biggest_mistake: reviewData.worst_move,
    })
  }

  const remaining = profile?.is_pro
    ? null
    : Math.max(0, 5 - (await getUsedToday(supabase, user.id)))

  return Response.json({ ...reviewData, remaining })
}
