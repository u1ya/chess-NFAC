# Chess Arena

A chess platform with an AI coach for players who want to improve, not just play.

## Overview

Chess Arena is a web application where you can play chess and get instant AI-powered feedback on your games.

No need to register on third-party platforms, no overwhelming engine analysis with endless arrows and variations — just clear, human-friendly feedback on what went wrong, what you did well, and how you can improve.

## Who Is It For?

Chess Arena is designed for casual players who enjoy chess and want to gradually improve their skills.

It's not aimed at players who memorize opening theory 20 moves deep. Instead, it's for those who want to understand why they lose games and walk away with one actionable piece of advice after each match.

## Game Modes

- **Play with a Friend** — Create or join a room using a unique code, play in real time, and compete for rating points.
- **Play Against AI** — Challenge Stockfish at three difficulty levels: Beginner, Intermediate, and Master.
- **Local Multiplayer** — Play against a friend on the same device.

## Why Chess Arena?

Most chess platforms are either overloaded with features or lock useful analysis tools behind paid subscriptions.

Chess Arena takes a different approach: **5 free AI game analyses per day**, enough for everyday players to learn from their games. For more active players, a Pro subscription removes this limit.

The AI coach doesn't try to replace Stockfish. Instead, it answers the questions real players actually care about:

- What was my biggest mistake?
- What did I do well?
- What should I focus on improving?

The goal is simple: **make every game an opportunity to learn.**

## Tech Stack

- **Next.js 16** — App Router and Server Actions
- **Supabase** — PostgreSQL, Authentication, and Realtime
- **Stockfish** — WebAssembly (WASM) for in-browser chess analysis
- **Gemini 2.0 Flash** — AI-powered game reviews and personalized feedback
- **react-chessboard** — Interactive chessboard UI
- **chess.js** — Chess rules, move validation, and game logic

## Getting Started

### Run Locally

```bash
npm install
cp .env.local.example .env.local   # Add your Supabase and Gemini API keys
npm run dev
```

### Environment Variables

| Variable | Where to Get It |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |

---

**Chess Arena — Play. Learn. Improve.**
