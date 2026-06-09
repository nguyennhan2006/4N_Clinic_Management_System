import { useState, useCallback } from 'react'
import { type Theme, getStoredTheme, applyTheme } from '@/lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setThemeState(next)
  }, [theme])

  return { theme, toggle }
}
