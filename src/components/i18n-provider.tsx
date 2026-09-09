'use client'

import * as React from 'react'
import { Dictionary, dictionaries, Locale } from '@/lib/i18n/dictionaries'

interface I18nContextType {
  locale: Locale
  t: Dictionary
}

const I18nContext = React.createContext<I18nContextType>({
  locale: 'en',
  t: dictionaries['en']
})

export function I18nProvider({ 
  locale, 
  children 
}: { 
  locale: Locale
  children: React.ReactNode 
}) {
  const t = dictionaries[locale] || dictionaries['en']

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return React.useContext(I18nContext)
}
