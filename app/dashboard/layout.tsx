import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import Navigation from '@/components/Navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-glass-border hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
            WorkLog
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Time Tracking Evolved
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <Navigation />
        </div>

        <div className="p-4 border-t border-glass-border">
          <div className="px-4 py-3 mb-2 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs font-medium text-primary mb-1">Signed in as</p>
            <p className="text-sm font-semibold truncate text-foreground" title={user.email}>
              {user.user_metadata.full_name || user.email?.split('@')[0]}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="h-full p-8 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
