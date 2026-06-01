import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import type { Settings, ColorTheme } from '@time-foundry/core'
import { DEFAULT_SETTINGS } from '@time-foundry/core'

const SETTINGS_KEY = 'tf_settings'

export const THEME_COLORS: Record<ColorTheme, { primary: string; primaryForeground: string }> = {
  sky:      { primary: '#30BCED', primaryForeground: '#ffffff' },
  deepsea:  { primary: '#1d4ed8', primaryForeground: '#ffffff' },
  foundry:  { primary: '#d97706', primaryForeground: '#ffffff' },
  neonrose: { primary: '#f43f5e', primaryForeground: '#ffffff' },
  earth:    { primary: '#92400e', primaryForeground: '#ffffff' },
  steel:    { primary: '#64748b', primaryForeground: '#ffffff' },
  candy:    { primary: '#a855f7', primaryForeground: '#ffffff' },
  custom:   { primary: '#30BCED', primaryForeground: '#ffffff' },
}

function getPrimaryColor(settings: Settings): string {
  if (settings.colorTheme === 'custom') {
    return /^#[0-9a-fA-F]{6}$/.test(settings.customPrimary)
      ? settings.customPrimary
      : '#30BCED'
  }
  return THEME_COLORS[settings.colorTheme].primary
}

function applyTheme(settings: Settings) {
  if (settings.theme === 'system') {
    Appearance.setColorScheme(null)
  } else {
    Appearance.setColorScheme(settings.theme)
  }
}

interface SettingsStore {
  settings: Settings
  primaryColor: string
  load: () => Promise<void>
  update: (partial: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  primaryColor: THEME_COLORS[DEFAULT_SETTINGS.colorTheme].primary,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY)
      const stored = raw ? (JSON.parse(raw) as Partial<Settings>) : {}
      const settings: Settings = { ...DEFAULT_SETTINGS, ...stored }
      applyTheme(settings)
      set({ settings, primaryColor: getPrimaryColor(settings) })
    } catch {
      applyTheme(DEFAULT_SETTINGS)
    }
  },

  update: async (partial) => {
    const updated = { ...get().settings, ...partial }
    applyTheme(updated)
    set({ settings: updated, primaryColor: getPrimaryColor(updated) })
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    } catch {}
  },
}))
