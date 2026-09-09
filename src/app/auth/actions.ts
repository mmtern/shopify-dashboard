'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const INTERNAL_DOMAIN = '@internal.dashboard.com'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  if (sanitizedUsername.length === 0) {
    return { error: 'Username contains invalid characters' }
  }

  const email = `${sanitizedUsername}${INTERNAL_DOMAIN}`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid username or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, '')

  if (sanitizedUsername.length < 3) {
    return { error: 'Username must be at least 3 characters, letters and numbers only' }
  }

  const email = `${sanitizedUsername}${INTERNAL_DOMAIN}`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: sanitizedUsername,
        display_name: username.trim(),
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Username already taken' }
    }
    return { error: error.message }
  }

  // Create staff record
  if (data.user) {
    await supabase.from('staff').upsert({
      id: data.user.id,
      username: username.toLowerCase().trim(),
      display_name: username,
      role: 'staff',
    })
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function setLocale(locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase
      .from('staff')
      .update({ locale })
      .eq('id', user.id)
      
    revalidatePath('/', 'layout')
  }
}
