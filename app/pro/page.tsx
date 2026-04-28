import { createClient } from '@/lib/supabase-server'
import ProPageClient from '@/components/ProPageClient'
import Link from 'next/link'

export default async function ProPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  if (user) {
    const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
    isPro = data?.is_pro ?? false
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#888' }}>
          ← Лобби
        </Link>
        <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>Upgrade to Pro</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <ProPageClient isLoggedIn={!!user} isPro={isPro} />
      </main>
    </div>
  )
}
