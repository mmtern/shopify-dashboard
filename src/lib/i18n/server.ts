import { createClient } from '@/lib/supabase/server'
import { dictionaries, Locale } from './dictionaries'

export async function getDictionary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let locale: Locale = 'en'
  if (user) {
    const { data: staff } = await supabase
      .from('staff')
      .select('locale')
      .eq('id', user.id)
      .single()
      
    if (staff && staff.locale) {
      locale = staff.locale as Locale
    }
  }
  return dictionaries[locale] || dictionaries['en']
}
