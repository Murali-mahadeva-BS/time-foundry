import { useState } from 'react'
import { Settings, Moon, Sun, Monitor, Clock, Coffee, Zap, Timer, SkipForward, Palette } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings.store'
import type { Theme, ColorTheme } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function DurationInput({ value, onChange, min = 1, max = 120 }: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className="w-20 text-center"
      />
      <span className="text-sm text-muted-foreground">min</span>
    </div>
  )
}

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-3.5 w-3.5" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
]

interface ColorThemeDef {
  value: ColorTheme
  label: string
  swatches: string[]   // 3 key colors to display
  desc: string
}

const COLOR_THEMES: ColorThemeDef[] = [
  {
    value: 'sky',
    label: 'Sky',
    swatches: ['#30BCED', '#FFFAFF', '#FC5130'],
    desc: 'Bright Sky · Ghost White · Tomato',
  },
  {
    value: 'deepsea',
    label: 'Deep Sea',
    swatches: ['#1C7293', '#21295C', '#9EB3C2'],
    desc: 'Cerulean · Space Indigo · Powder Blue',
  },
  {
    value: 'indigo',
    label: 'Indigo Burst',
    swatches: ['#758BFD', '#27187E', '#FF8600'],
    desc: 'Cornflower Blue · Indigo Ink · Orange',
  },
  {
    value: 'neonrose',
    label: 'Neon Rose',
    swatches: ['#F42272', '#D7B8F3', '#232E21'],
    desc: 'Neon Pink · Mauve · Charcoal Brown',
  },
  {
    value: 'earth',
    label: 'Earth',
    swatches: ['#C17C74', '#2A3D45', '#DDC9B4'],
    desc: 'Dusty Rose · Charcoal Blue · Pale Oak',
  },
  {
    value: 'steel',
    label: 'Steel',
    swatches: ['#1985A1', '#46494C', '#DCDCDD'],
    desc: 'Pacific Cyan · Iron Grey · Alabaster',
  },
  {
    value: 'candy',
    label: 'Candy',
    swatches: ['#4ECDC4', '#292F36', '#FF6B6B'],
    desc: 'Strong Cyan · Jet Black · Grapefruit',
  },
  {
    value: 'custom',
    label: 'Custom',
    swatches: [],
    desc: 'Your own hex color',
  },
]

export function SettingsPanel() {
  const { settings, update } = useSettingsStore()
  const [customInput, setCustomInput] = useState(settings.customPrimary ?? '#30BCED')

  const handleCustomApply = () => {
    if (/^#[0-9a-fA-F]{6}$/.test(customInput)) {
      update({ colorTheme: 'custom', customPrimary: customInput })
    }
  }

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-base font-semibold">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-lg space-y-8">

          {/* Appearance */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h2>

            <SettingRow label="Mode" description="Light, dark, or follow system preference">
              <div className="flex items-center rounded-md border p-0.5 gap-0.5">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ theme: opt.value })}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                      settings.theme === opt.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </SettingRow>

            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Color theme
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((ct) => {
                  const isSelected = settings.colorTheme === ct.value
                  return (
                    <button
                      key={ct.value}
                      onClick={() => {
                        if (ct.value !== 'custom') update({ colorTheme: ct.value })
                        else update({ colorTheme: 'custom', customPrimary: customInput })
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border',
                      )}
                    >
                      {ct.value === 'custom' ? (
                        <span
                          className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-[10px] text-muted-foreground"
                        >
                          +
                        </span>
                      ) : (
                        <span className="flex gap-0.5 shrink-0">
                          {ct.swatches.map((c) => (
                            <span key={c} className="h-6 w-2 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{ct.label}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{ct.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Custom color input */}
              {settings.colorTheme === 'custom' && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <input
                    type="color"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <Input
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="#30BCED"
                    className="h-8 font-mono text-xs uppercase"
                    maxLength={7}
                  />
                  <button
                    onClick={handleCustomApply}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Pomodoro */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pomodoro Timer</h2>

            <SettingRow label="Work session" description="Duration of each focus session">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <DurationInput value={settings.workDuration} onChange={(v) => update({ workDuration: v })} />
              </div>
            </SettingRow>

            <SettingRow label="Short break" description="Break after each work session">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-emerald-500" />
                <DurationInput value={settings.shortBreakDuration} onChange={(v) => update({ shortBreakDuration: v })} />
              </div>
            </SettingRow>

            <SettingRow label="Long break" description="Extended break after N sessions">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-violet-500" />
                <DurationInput value={settings.longBreakDuration} onChange={(v) => update({ longBreakDuration: v })} />
              </div>
            </SettingRow>

            <SettingRow label="Long break after" description="Number of sessions before a long break">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.longBreakAfter}
                  onChange={(e) => update({ longBreakAfter: Math.max(1, parseInt(e.target.value) || 4) })}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">sessions</span>
              </div>
            </SettingRow>

            <SettingRow label="Skip breaks" description="Automatically skip breaks and go straight to the next session">
              <div className="flex items-center gap-2">
                <SkipForward className={cn('h-4 w-4', settings.skipBreaks ? 'text-primary' : 'text-muted-foreground')} />
                <Switch checked={settings.skipBreaks} onCheckedChange={(v) => update({ skipBreaks: v })} />
              </div>
            </SettingRow>
          </section>

          <Separator />

          {/* Idle detection */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Idle Detection</h2>
            <SettingRow label="Idle threshold" description="Pause timer when inactive for this long">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <DurationInput value={settings.idleThresholdMinutes} onChange={(v) => update({ idleThresholdMinutes: v })} min={1} max={30} />
              </div>
            </SettingRow>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Time Foundry v1.0.0 · Local storage only</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
