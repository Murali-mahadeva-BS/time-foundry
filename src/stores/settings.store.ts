import { create } from 'zustand'
import type { Settings, Theme, ColorTheme } from '@/types'

const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  idleThresholdMinutes: 5,
  skipBreaks: false,
  theme: 'system',
  colorTheme: 'sky',
  customPrimary: '#30BCED',
}

const ALL_THEME_CLASSES = [
  'theme-sky', 'theme-deepsea', 'theme-indigo',
  'theme-neonrose', 'theme-earth', 'theme-steel', 'theme-candy',
]

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark ?? true)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

function applyColorTheme(colorTheme: ColorTheme, customPrimary: string) {
  const root = document.documentElement
  root.classList.remove(...ALL_THEME_CLASSES)
  root.style.removeProperty('--primary')
  root.style.removeProperty('--ring')
  root.style.removeProperty('--primary-foreground')

  if (colorTheme === 'custom') {
    const hex = /^#[0-9a-fA-F]{6}$/.test(customPrimary) ? customPrimary : '#30BCED'
    const { h, s, l } = hexToHsl(hex)
    const fg = l > 55 ? '0 0% 10%' : '0 0% 100%'
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`)
    root.style.setProperty('--ring', `${h} ${s}% ${l}%`)
    root.style.setProperty('--primary-foreground', fg)
  } else {
    root.classList.add(`theme-${colorTheme}`)
  }
}

interface SettingsStore {
  settings: Settings
  load: () => Promise<void>
  update: (partial: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  load: async () => {
    const result = await chrome.storage.local.get('settings')
    const stored = result.settings as Partial<Settings & { darkMode?: boolean }> | undefined

    let migrated: Partial<Settings> = {}
    if (stored) {
      if ('darkMode' in stored && !('theme' in stored)) {
        migrated = { ...stored, theme: stored.darkMode ? 'dark' : 'light' }
        delete (migrated as Record<string, unknown>).darkMode
      } else {
        migrated = stored
      }
    }

    const settings: Settings = { ...DEFAULT_SETTINGS, ...migrated }
    set({ settings })
    applyTheme(settings.theme)
    applyColorTheme(settings.colorTheme, settings.customPrimary)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', () => {
      if (get().settings.theme === 'system') {
        document.documentElement.classList.toggle('dark', mq.matches)
      }
    })
  },

  update: async (partial) => {
    const updated = { ...get().settings, ...partial }
    set({ settings: updated })
    await chrome.storage.local.set({ settings: updated })
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: updated })
    applyTheme(updated.theme)
    applyColorTheme(updated.colorTheme, updated.customPrimary)
  },
}))
