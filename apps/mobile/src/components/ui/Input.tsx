import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { useSettingsStore } from '../../stores/settings.store'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const primary = useSettingsStore((s) => s.primaryColor)

  return (
    <View style={{ gap: 4 }}>
      {label && <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748b' }}>{label}</Text>}
      <TextInput
        placeholderTextColor="#94a3b8"
        style={[
          {
            borderWidth: 1,
            borderColor: error ? '#ef4444' : '#e2e8f0',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: '#0f172a',
            backgroundColor: '#ffffff',
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={{ fontSize: 12, color: '#ef4444' }}>{error}</Text>}
    </View>
  )
}
