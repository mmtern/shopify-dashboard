'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Client-side validation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const username = formData.get('username') as string

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-sky-900/10 via-transparent to-transparent" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute -right-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute -left-32 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />

      {/* Card */}
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card
          className={cn(
            'border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl',
            'ring-1 ring-white/[0.05]'
          )}
        >
          <CardHeader className="space-y-3 pb-2 text-center">
            {/* Logo / Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 ring-1 ring-white/10">
              <span className="text-2xl" role="img" aria-label="Rocket">
                🚀
              </span>
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-semibold tracking-tight text-white">
                Create Account
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Set up your dashboard credentials
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <form action={handleSubmit} className="space-y-5">
              {/* Error message */}
              {error && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 15A7 7 0 108 1a7 7 0 000 14zm-.75-4.5a.75.75 0 001.5 0v-1a.75.75 0 00-1.5 0v1zm.75-6a.75.75 0 00-.75.75v2a.75.75 0 001.5 0v-2A.75.75 0 008 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-slate-300">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  autoComplete="username"
                  autoFocus
                  disabled={isPending}
                  className={cn(
                    'h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-white',
                    'placeholder:text-slate-500',
                    'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20',
                    'transition-all duration-200'
                  )}
                />
                <p className="text-xs text-slate-500">
                  At least 3 characters, letters and numbers only
                </p>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={isPending}
                  className={cn(
                    'h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-white',
                    'placeholder:text-slate-500',
                    'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20',
                    'transition-all duration-200'
                  )}
                />
                <p className="text-xs text-slate-500">
                  Minimum 6 characters
                </p>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm text-slate-300"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={isPending}
                  className={cn(
                    'h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-white',
                    'placeholder:text-slate-500',
                    'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20',
                    'transition-all duration-200'
                  )}
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isPending}
                className={cn(
                  'h-10 w-full rounded-lg font-medium',
                  'bg-gradient-to-r from-emerald-600 to-sky-600',
                  'hover:from-emerald-500 hover:to-sky-500',
                  'text-white shadow-lg shadow-emerald-500/20',
                  'transition-all duration-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                size="lg"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Internal production management system
        </p>
      </div>
    </div>
  )
}
