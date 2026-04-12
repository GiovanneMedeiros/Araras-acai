import { useEffect, useState } from "react"

const THEME_STORAGE_KEY = "araras-theme-mode"

function getInitialDarkMode() {
  if (typeof window === "undefined") return false

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "dark") return true
  if (stored === "light") return false

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
}

export function useThemeMode() {
  const [isDark, setIsDark] = useState(getInitialDarkMode)

  useEffect(() => {
    if (typeof window === "undefined") return

    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light")
    document.body.classList.toggle("theme-dark", isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  function toggleTheme() {
    setIsDark((prev) => !prev)
  }

  return { isDark, toggleTheme }
}
