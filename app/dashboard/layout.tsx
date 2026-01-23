import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from '@/components/LogoutButton'
import Navigation from '@/components/Navigation'
import Sidebar from '@/components/Sidebar'

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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      <Sidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[50px_50px]" />
        <div className="h-full p-4 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
