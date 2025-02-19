'use client'

import { Button } from "@/components/ui/button"
import { useLocale } from "@/contexts/LocaleContext"

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === 'it' ? 'en' : 'it')}
      className="w-9 px-0"
    >
      {locale === 'it' ? '🇮🇹' : '🇬🇧'}
    </Button>
  )
} 