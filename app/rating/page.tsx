import { createClient } from '@/lib/supabase-server'
import RatingPageClient from '@/components/RatingPageClient'
import Link from 'next/link'

export default async function RatingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('rating', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#888' }}>
          ← Лобби
        </Link>
        <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>Городской рейтинг</span>
      </header>
      <main className="flex flex-1 p-6">
        <RatingPageClient profiles={profiles ?? []} currentUserId={user?.id} />
      </main>
    </div>
  )
}
