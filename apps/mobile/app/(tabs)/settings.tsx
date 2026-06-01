import { useState } from 'react'
import { ScrollView, View, Text, Switch, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { useSettingsStore } from '../../src/stores/settings.store'
import type { ColorTheme, Theme } from '@time-foundry/core'
import { Input } from '../../src/components/ui/Input'

const COLOR_THEMES: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'sky',      label: 'Sky',      color: '#30BCED' },
  { id: 'deepsea',  label: 'Deep Sea', color: '#1d4ed8' },
  { id: 'foundry',  label: 'Foundry',  color: '#d97706' },
  { id: 'neonrose', label: 'Neon Rose',color: '#f43f5e' },
  { id: 'earth',    label: 'Earth',    color: '#92400e' },
  { id: 'steel',    label: 'Steel',    color: '#64748b' },
  { id: 'candy',    label: 'Candy',    color: '#a855f7' },
  { id: 'custom',   label: 'Custom',   color: '#30BCED' },
]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionBody}>{children}</View>
    </View>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sStyles.row}>
      <Text style={sStyles.rowLabel}>{label}</Text>
      {children}
    </View>
  )
}

function DurationRow({ label, valueKey }: { label: string; valueKey: 'workDuration' | 'shortBreakDuration' | 'longBreakDuration' | 'longBreakAfter' }) {
  const value = useSettingsStore((s) => s.settings[valueKey])
  const update = useSettingsStore((s) => s.update)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(String(value))
  const primary = useSettingsStore((s) => s.primaryColor)

  function save() {
    const n = parseInt(text)
    if (!isNaN(n) && n > 0) void update({ [valueKey]: n })
    else setText(String(value))
    setEditing(false)
  }

  return (
    <Row label={label}>
      {editing ? (
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={save}
          onSubmitEditing={save}
          keyboardType="number-pad"
          autoFocus
          style={{ borderBottomWidth: 1.5, borderBottomColor: primary, fontSize: 14, color: '#0f172a', minWidth: 48, textAlign: 'center' }}
        />
      ) : (
        <TouchableOpacity onPress={() => { setText(String(value)); setEditing(true) }}>
          <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '600', minWidth: 36, textAlign: 'center' }}>
            {value}
          </Text>
        </TouchableOpacity>
      )}
    </Row>
  )
}

export default function SettingsScreen() {
  const { settings, update } = useSettingsStore()
  const primary = useSettingsStore((s) => s.primaryColor)

  return (
    <ScrollView style={sStyles.container} contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Section title="Timer">
        <DurationRow label="Work (minutes)" valueKey="workDuration" />
        <DurationRow label="Short break (minutes)" valueKey="shortBreakDuration" />
        <DurationRow label="Long break (minutes)" valueKey="longBreakDuration" />
        <DurationRow label="Sessions before long break" valueKey="longBreakAfter" />
        <Row label="Skip breaks">
          <Switch
            value={settings.skipBreaks}
            onValueChange={(v) => void update({ skipBreaks: v })}
            trackColor={{ true: primary }}
          />
        </Row>
        <Row label="Auto-start next session">
          <Switch
            value={settings.autoStartNextSession}
            onValueChange={(v) => void update({ autoStartNextSession: v })}
            trackColor={{ true: primary }}
          />
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => void update({ theme: t.id })}
                style={[
                  sStyles.chip,
                  settings.theme === t.id && { backgroundColor: primary, borderColor: primary },
                ]}
              >
                <Text style={[sStyles.chipText, settings.theme === t.id && { color: '#fff' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Row>

        <View style={{ gap: 10 }}>
          <Text style={sStyles.rowLabel}>Color theme</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {COLOR_THEMES.map((ct) => (
              <TouchableOpacity
                key={ct.id}
                onPress={() => void update({ colorTheme: ct.id })}
                style={[
                  sStyles.colorSwatch,
                  { backgroundColor: ct.id === 'custom' ? (settings.customPrimary || ct.color) : ct.color },
                  settings.colorTheme === ct.id && { borderWidth: 3, borderColor: '#0f172a' },
                ]}
              >
                {settings.colorTheme === ct.id && (
                  <View style={sStyles.swatchCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: '#64748b' }}>
            {COLOR_THEMES.find((c) => c.id === settings.colorTheme)?.label}
          </Text>
        </View>

        {settings.colorTheme === 'custom' && (
          <Row label="Custom hex">
            <Input
              value={settings.customPrimary}
              onChangeText={(v) => void update({ customPrimary: v })}
              placeholder="#30BCED"
              style={{ width: 120 }}
            />
          </Row>
        )}
      </Section>
    </ScrollView>
  )
}

const sStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  section: { gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4, marginBottom: 4 },
  sectionBody: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  rowLabel: { fontSize: 14, color: '#0f172a', flex: 1 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  swatchCheck: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff', opacity: 0.9 },
})
