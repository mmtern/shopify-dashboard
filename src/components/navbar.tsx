'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { signOut, setLocale } from '@/app/auth/actions'
import { LogOut, Zap } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTranslation } from '@/components/i18n-provider'

interface NavbarProps {
  username: string
}

export function Navbar({ username }: NavbarProps) {
  const { t, locale } = useTranslation()

  const initials = username
    .split(/[\s._-]/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Subtle bottom glow line */}
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
        {/* Left side — Logo */}
        <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
          {/* Light mode logo (black version) - Hidden in dark mode */}
          <img 
            src="/logo-black.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain dark:hidden"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-xl font-bold dark:hidden">Dashboard</span>' + e.currentTarget.parentElement!.innerHTML;
            }}
          />
          {/* Dark mode logo (white version) - Hidden in light mode */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain hidden dark:block"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML += '<span class="text-xl font-bold hidden dark:block">Dashboard</span>';
            }}
          />
        </Link>

        {/* Right side — User menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Popover>
            <PopoverTrigger 
              render={
                <button
                  type="button"
                  className="relative flex items-center h-auto gap-2.5 rounded-full py-1.5 pl-3 pr-2 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <span className="hidden text-sm font-medium sm:inline-block">
                {username}
              </span>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials || 'U'}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={8} className="w-56 p-1">
              <div className="flex flex-col space-y-1.5 px-2 py-2">
                <p className="text-sm font-semibold leading-none">{username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {t.staff}
                </p>
              </div>
              
              <div className="h-px bg-border my-1 mx-1" />
              
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.language}
              </div>
              <button
                className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${locale === 'en' ? 'bg-accent/50 text-accent-foreground' : ''}`}
                onClick={async () => {
                  await setLocale('en')
                }}
              >
                {t.english}
              </button>
              <button
                className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${locale === 'tr' ? 'bg-accent/50 text-accent-foreground' : ''}`}
                onClick={async () => {
                  await setLocale('tr')
                }}
              >
                {t.turkish}
              </button>

              <div className="h-px bg-border my-1 mx-1" />
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={async () => {
                  await signOut()
                }}
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
