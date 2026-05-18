import { useMemo, useState } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '../../lib/utils'

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
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!normalizedQuery) return EMOJI_GROUPS
    return EMOJI_GROUPS
      .map((group) => ({
        ...group,
        emojis: group.emojis.filter(
          (emoji) =>
            emoji.includes(normalizedQuery) ||
            group.label.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.emojis.length > 0)
  }, [normalizedQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="border-b px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emojis"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="max-h-80 overflow-auto p-2">
          <EmojiGrid
            groups={filtered}
            value={value}
            onChange={(e) => {
              onChange(e)
              setOpen(false)
              setQuery('')
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Recent', emojis: ['📕', '🎒', '📚', '🚀', '⚡', '✅', '🧠', '🛠️', '📌', '📝', '💼', '📦'] },
  { label: 'People', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😍', '🤩', '😘', '😗', '🤔', '😌', '😎', '🥳', '🤝', '🙌', '👏', '💪'] },
  { label: 'Work', emojis: ['💼', '🏢', '⚡', '🚀', '🎯', '💡', '🔥', '⭐', '✅', '📌', '🔑', '💎', '🧭', '📈', '📉', '📊'] },
  { label: 'Development', emojis: ['💻', '🖥️', '🔧', '⚙️', '🛠️', '📦', '🐛', '🔍', '🧪', '🧬', '🛰️', '⌨️', '🖱️', '🧠', '🔒', '🧱'] },
  { label: 'Project', emojis: ['📁', '📂', '🗃️', '📋', '📝', '📄', '📑', '🗒️', '📔', '📓', '📚', '🗄️', '🧾', '📎', '🗂️', '🪄'] },
  { label: 'Objects', emojis: ['🎨', '✏️', '🖌️', '🧵', '🧲', '🕹️', '🎧', '📷', '📱', '🕰️', '📡', '🔋', '💿', '🔔', '🕯️', '🧰'] },
  { label: 'Nature', emojis: ['🌱', '🌿', '🍃', '🌲', '🌸', '🌺', '🌻', '🌙', '☀️', '🌊', '🌍', '🌈', '🔥', '🌩️', '❄️', '🍀'] },
]

function EmojiGrid({
  groups,
  value,
  onChange,
}: {
  groups: { label: string; emojis: string[] }[]
  value?: string
  onChange: (e: string) => void
}) {
  return (
    <div className="space-y-2">
      {groups.map(({ label, emojis }) => (
        <div key={label}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
          <div className="grid grid-cols-10 gap-1">
            {emojis.map((emoji) => (
              <button
                key={`${label}-${emoji}`}
                onClick={() => onChange(emoji)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent',
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
