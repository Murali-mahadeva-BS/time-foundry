import { ICON_MAP, isLucideIcon } from './icon-picker'
import { cn } from '../../lib/utils'

interface ProjectIconProps {
  icon?: string
  fallback?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function ProjectIcon({ icon, fallback = 'Folder', className, size = 'md' }: ProjectIconProps) {
  const value = icon ?? fallback
  if (isLucideIcon(value)) {
    const Icon = ICON_MAP[value]
    return <Icon className={cn(SIZE_MAP[size], className)} />
  }
  // Emoji
  const emojiSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
  return <span className={cn('leading-none', emojiSize, className)}>{value}</span>
}
