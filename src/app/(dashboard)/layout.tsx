import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'

export default async function DashboardLayout({
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

  const username =
    (user.user_metadata?.username as string) ||
    user.email?.split('@')[0] ||
    'User'

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={username} />
      <main className="container mx-auto max-w-[1600px] px-4 py-6">
        {children}
      </main>
    </div>
  )
}
