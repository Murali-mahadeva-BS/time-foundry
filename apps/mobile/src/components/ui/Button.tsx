import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native'
import { useSettingsStore } from '../../stores/settings.store'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'default', size = 'md', loading, children, style, disabled, ...props }: ButtonProps) {
  const primary = useSettingsStore((s) => s.primaryColor)

  const bg = variant === 'default' ? primary
    : variant === 'destructive' ? '#ef4444'
    : 'transparent'

  const borderColor = variant === 'outline' ? primary : 'transparent'

  const pad = size === 'sm' ? { paddingHorizontal: 12, paddingVertical: 6 }
    : size === 'lg' ? { paddingHorizontal: 24, paddingVertical: 14 }
    : size === 'icon' ? { padding: 8 }
    : { paddingHorizontal: 16, paddingVertical: 10 }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bg,
          borderRadius: 8,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          ...pad,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'default' ? '#fff' : primary} />
      ) : (
        children
      )}
    </TouchableOpacity>
  )
}

interface ButtonTextProps {
  variant?: Variant
  size?: Size
  children: string
}

export function ButtonText({ variant = 'default', size = 'md', children }: ButtonTextProps) {
  const primary = useSettingsStore((s) => s.primaryColor)
  const color = variant === 'default' || variant === 'destructive' ? '#fff' : primary
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14

  return <Text style={{ color, fontSize, fontWeight: '600' }}>{children}</Text>
}
