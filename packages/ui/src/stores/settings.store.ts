// Default stub — each platform overrides this via Vite resolve.alias.
import { create } from 'zustand'
import type { Settings, Theme, ColorTheme } from '@time-foundry/core'
import { DEFAULT_SETTINGS } from '@time-foundry/core'

export interface SettingsStoreShape {
  settings: Settings
  load: () => Promise<void>
  update: (partial: Partial<Settings>) => Promise<void>
}

export { DEFAULT_SETTINGS }
export type { Theme, ColorTheme }

export const useSettingsStore = create<SettingsStoreShape>(() => ({
  settings: { ...DEFAULT_SETTINGS },
  load: async () => {},
  update: async () => {},
}))
