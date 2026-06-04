import { useEffect, useState } from 'react'
import { Settings, Moon, Sun, Monitor, Clock, Coffee, Zap, Timer, SkipForward, Palette, AlarmClock, Hourglass, Download, Upload } from 'lucide-react'
import { useSettingsStore } from '@ui/stores/settings.store'
import type { Theme, ColorTheme, TimerMode } from '@time-foundry/core'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-0.5">
        <Label>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex w-56 shrink-0 justify-end">
        {children}
      </div>
    </div>
  )
}

function ClampedNumberInput({ value, onChange, suffix, min = 1, max = 120 }: {
  value: number
  onChange: (v: number) => void
  suffix: string
  min?: number
  max?: number
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number.parseInt(draft, 10)
    const next = Number.isFinite(parsed)
      ? Math.max(min, Math.min(max, parsed))
      : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className="grid w-40 grid-cols-[5rem_1fr] items-center gap-3">
      <Input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(String(value))
        }}
        className="w-20 text-center"
      />
      <span className="text-sm text-muted-foreground">{suffix}</span>
    </div>
  )
}

function TimerNumberControl({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="grid w-52 grid-cols-[1rem_1fr] items-center gap-4">
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {children}
    </div>
  )
}

function TimerSwitchControl({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex w-52 items-center justify-between">
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {children}
    </div>
  )
}

function DurationInput(props: Omit<Parameters<typeof ClampedNumberInput>[0], 'suffix'>) {
  return <ClampedNumberInput {...props} suffix="min" />
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
    value: 'foundry',
    label: 'Foundry',
    swatches: ['#FFE4A8', '#F37A1F', '#1A2029'],
    desc: 'Molten White · Pour Orange · Forge Steel',
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

export interface SettingsPanelDataActions {
  onExportData?: () => void
  onImportData?: () => void
}

export function SettingsPanel({ dataActions }: { dataActions?: SettingsPanelDataActions } = {}) {
  const { settings, update } = useSettingsStore()
  const [customInput, setCustomInput] = useState(settings.customPrimary ?? '#30BCED')
  const hasDataActions = Boolean(dataActions?.onExportData || dataActions?.onImportData)

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

          {/* Timer */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timer</h2>

            <SettingRow label="Default timer mode" description="Applied when creating new tasks — can be overridden per task">
              <div className="flex items-center rounded-md border p-0.5 gap-0.5">
                {([
                  { value: 'pomodoro' as TimerMode, label: 'Pomodoro', icon: <AlarmClock className="h-3.5 w-3.5" /> },
                  { value: 'free' as TimerMode, label: 'Free', icon: <Hourglass className="h-3.5 w-3.5" /> },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ defaultTimerMode: opt.value })}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                      settings.defaultTimerMode === opt.value
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
          </section>

          <Separator />

          {/* Pomodoro config */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pomodoro Settings</h2>

            <SettingRow label="Work session" description="Duration of each focus session">
              <TimerNumberControl icon={<Zap className="h-4 w-4 text-primary" />}>
                <DurationInput value={settings.workDuration} onChange={(v) => update({ workDuration: v })} />
              </TimerNumberControl>
            </SettingRow>

            <SettingRow label="Short break" description="Break after each work session">
              <TimerNumberControl icon={<Coffee className="h-4 w-4 text-emerald-500" />}>
                <DurationInput value={settings.shortBreakDuration} onChange={(v) => update({ shortBreakDuration: v })} />
              </TimerNumberControl>
            </SettingRow>

            <SettingRow label="Long break" description="Extended break after N sessions">
              <TimerNumberControl icon={<Coffee className="h-4 w-4 text-violet-500" />}>
                <DurationInput value={settings.longBreakDuration} onChange={(v) => update({ longBreakDuration: v })} />
              </TimerNumberControl>
            </SettingRow>

            <SettingRow label="Long break after" description="Number of sessions before a long break">
              <TimerNumberControl icon={<Clock className="h-4 w-4 text-muted-foreground" />}>
                <ClampedNumberInput
                  value={settings.longBreakAfter}
                  onChange={(v) => update({ longBreakAfter: v })}
                  min={1}
                  max={10}
                  suffix="sessions"
                />
              </TimerNumberControl>
            </SettingRow>

            <SettingRow label="Skip breaks" description="Automatically skip breaks and go straight to the next session">
              <TimerSwitchControl icon={<SkipForward className={cn('h-4 w-4', settings.skipBreaks ? 'text-primary' : 'text-muted-foreground')} />}>
                <Switch checked={settings.skipBreaks} onCheckedChange={(v) => update({ skipBreaks: v })} />
              </TimerSwitchControl>
            </SettingRow>
          </section>

          <Separator />

          {/* Idle detection */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Idle Detection</h2>
            <SettingRow label="Idle threshold" description="Pause timer when inactive for this long">
              <TimerNumberControl icon={<Timer className="h-4 w-4 text-muted-foreground" />}>
                <DurationInput value={settings.idleThresholdMinutes} onChange={(v) => update({ idleThresholdMinutes: v })} min={1} max={30} />
              </TimerNumberControl>
            </SettingRow>
          </section>

          <Separator />

          {hasDataActions && (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Data</h2>
                <div className="grid grid-cols-2 gap-2">
                  {dataActions?.onExportData && (
                    <button
                      type="button"
                      onClick={dataActions.onExportData}
                      className="flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                      Export JSON
                    </button>
                  )}
                  {dataActions?.onImportData && (
                    <button
                      type="button"
                      onClick={dataActions.onImportData}
                      className="flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <Upload className="h-4 w-4" />
                      Import JSON
                    </button>
                  )}
                </div>
              </section>

              <Separator />
            </>
          )}

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
