import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { claims } } = await supabase.auth.getClaims()

  if (claims) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
