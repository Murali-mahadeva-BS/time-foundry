import { View, Text } from 'react-native'

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  urgent:  { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  high:    { bg: 'rgba(249,115,22,0.1)',  text: '#f97316', border: 'rgba(249,115,22,0.3)' },
  medium:  { bg: 'rgba(234,179,8,0.1)',   text: '#ca8a04', border: 'rgba(234,179,8,0.3)' },
  low:     { bg: 'rgba(100,116,139,0.1)', text: '#64748b', border: 'rgba(100,116,139,0.3)' },
}

interface BadgeProps {
  label: string
  color?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
}

export function Badge({ label, color, priority }: BadgeProps) {
  const colors = priority ? PRIORITY_COLORS[priority] : null

  return (
    <View style={{
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors?.bg ?? (color ? `${color}22` : '#64748b22'),
      borderWidth: 1,
      borderColor: colors?.border ?? (color ?? '#64748b'),
      alignSelf: 'flex-start',
    }}>
      <Text style={{
        fontSize: 11,
        fontWeight: '600',
        color: colors?.text ?? (color ?? '#64748b'),
      }}>
        {label}
      </Text>
    </View>
  )
}
