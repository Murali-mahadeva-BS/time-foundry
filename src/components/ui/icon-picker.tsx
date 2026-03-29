import { useState } from 'react'
import {
  Folder, FolderOpen, Code2, Database, Globe, Rocket, Zap, Star,
  BookOpen, FileText, Layers, Package, Server, Terminal, Cpu, GitBranch,
  Bug, Wrench, Settings2, FlaskConical, Microscope, Brain, Lightbulb,
  Target, Trophy, Flag, Bookmark, Tag, Hash, Link, Mail, MessageSquare,
  Calendar, Clock, Timer, Bell, Shield, Lock, Key, Eye,
  BarChart2, TrendingUp, PieChart, Activity, Gauge,
  Users, User, Heart, Smile, Coffee, Music, Camera,
  Home, Building2, MapPin, Briefcase, ShoppingCart, CreditCard,
  Palette, Pen,
  Play, Pause, SkipForward, Volume2, Radio,
  Sun, Moon, Cloud, Droplets, Flame, Leaf,
  List, CheckSquare, Table2, Grid3x3, Layout,
  type LucideIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type IconName = string

// Map of icon name → Lucide component
export const ICON_MAP: Record<string, LucideIcon> = {
  Folder, FolderOpen, Code2, Database, Globe, Rocket, Zap, Star,
  BookOpen, FileText, Layers, Package, Server, Terminal, Cpu, GitBranch,
  Bug, Wrench, Settings2, FlaskConical, Microscope, Brain, Lightbulb,
  Target, Trophy, Flag, Bookmark, Tag, Hash, Link, Mail, MessageSquare,
  Calendar, Clock, Timer, Bell, Shield, Lock, Key, Eye,
  BarChart2, TrendingUp, PieChart, Activity, Gauge,
  Users, User, Heart, Smile, Coffee, Music, Camera,
  Home, Building2, MapPin, Briefcase, ShoppingCart, CreditCard,
  Palette, Pen, List, CheckSquare, Table2, Grid3x3, Layout,
  Play, Pause, SkipForward, Volume2, Radio,
  Sun, Moon, Cloud, Droplets, Flame, Leaf,
}

const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: 'Common',
    icons: ['Folder', 'FolderOpen', 'BookOpen', 'FileText', 'Layers', 'List', 'CheckSquare', 'Table2'],
  },
  {
    label: 'Development',
    icons: ['Code2', 'Terminal', 'Database', 'Server', 'GitBranch', 'Bug', 'Cpu', 'Package'],
  },
  {
    label: 'Product',
    icons: ['Rocket', 'Zap', 'Star', 'Target', 'Trophy', 'Flag', 'Lightbulb', 'Brain'],
  },
  {
    label: 'Tools',
    icons: ['Wrench', 'Settings2', 'FlaskConical', 'Microscope', 'Palette', 'Pen', 'Camera', 'Globe'],
  },
  {
    label: 'Data',
    icons: ['BarChart2', 'TrendingUp', 'PieChart', 'Activity', 'Gauge', 'Eye', 'Hash', 'Tag'],
  },
  {
    label: 'People',
    icons: ['Users', 'User', 'Heart', 'Smile', 'Coffee', 'Music', 'Mail', 'MessageSquare'],
  },
  {
    label: 'Business',
    icons: ['Briefcase', 'Building2', 'Home', 'ShoppingCart', 'CreditCard', 'Calendar', 'Bell', 'Shield'],
  },
]

// Check if icon value is a Lucide icon name
export function isLucideIcon(value: string): boolean {
  return value in ICON_MAP
}

interface IconPickerProps {
  value?: string
  onChange: (icon: string) => void
  children: React.ReactNode
}

export function IconPicker({ value, onChange, children }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'lucide' | 'emoji'>('lucide')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              tab === 'lucide' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('lucide')}
          >
            Icons
          </button>
          <button
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              tab === 'emoji' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab('emoji')}
          >
            Emoji
          </button>
        </div>

        <div className="max-h-72 overflow-auto p-2">
          {tab === 'lucide' ? (
            <div className="space-y-2">
              {ICON_GROUPS.map(({ label, icons }) => (
                <div key={label}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {icons.map((name) => {
                      const Icon = ICON_MAP[name]
                      return (
                        <button
                          key={name}
                          onClick={() => { onChange(name); setOpen(false) }}
                          title={name}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-accent',
                            value === name && 'bg-primary/10 ring-1 ring-primary',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmojiGrid value={value} onChange={(e) => { onChange(e); setOpen(false) }} />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Work', emojis: ['💼', '🏢', '⚡', '🚀', '🎯', '💡', '🔥', '⭐', '✅', '📌', '🔑', '💎'] },
  { label: 'Development', emojis: ['💻', '🖥️', '🔧', '⚙️', '🛠️', '📦', '🐛', '🔍', '📊', '🗂️', '🖱️', '⌨️'] },
  { label: 'Project', emojis: ['📁', '📂', '🗃️', '📋', '📝', '📄', '📑', '🗒️', '📔', '📓', '📚', '🗄️'] },
  { label: 'Design', emojis: ['🎨', '✏️', '🖌️', '🎭', '🖼️', '💎', '🌈', '🎪', '🎠', '🌟', '🪄', '🎬'] },
  { label: 'Team', emojis: ['👤', '👥', '🤝', '🏆', '🎖️', '🎗️', '🎁', '🎉', '🎊', '🥇', '🫂', '💪'] },
  { label: 'Nature', emojis: ['🌱', '🌿', '🍃', '🌲', '🌸', '🌺', '🌻', '🌙', '☀️', '🌊', '🔮', '🌍'] },
  { label: 'Tech', emojis: ['🤖', '📡', '🛰️', '🔬', '🧪', '🧬', '⚗️', '🔭', '💊', '🩺', '🧠', '🔋'] },
  { label: 'Finance', emojis: ['💰', '💳', '📈', '📉', '🏦', '🪙', '💵', '💸', '🎰', '🏪', '🛒', '📦'] },
]

function EmojiGrid({ value, onChange }: { value?: string; onChange: (e: string) => void }) {
  return (
    <div className="space-y-2">
      {EMOJI_GROUPS.map(({ label, emojis }) => (
        <div key={label}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
          <div className="grid grid-cols-12 gap-0.5">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onChange(emoji)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-accent',
                  value === emoji && 'bg-primary/10 ring-1 ring-primary',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
