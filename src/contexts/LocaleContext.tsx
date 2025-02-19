'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { en } from '@/translations/en'
import { it } from '@/translations/it'

type Locale = 'en' | 'it'
type Translations = typeof en

export type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const translations: Record<Locale, Translations> = { en, it }

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('it') // Default to Italian

  useEffect(() => {
    // Load saved locale preference from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && ['en', 'it'].includes(savedLocale)) {
      setLocale(savedLocale)
    }
  }, [])

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[locale]
    
    for (const k of keys) {
      if (value === undefined) break
      value = value[k]
    }
    
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }
    
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, key: string) => {
        return params[key]?.toString() || match
      })
    }
    
    return value
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
} 