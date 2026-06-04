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
import { ScrollArea } from './scroll-area'
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
          (emoji) => emojiMatchesQuery(emoji, group.label, normalizedQuery),
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
        <ScrollArea className="h-80 p-2">
          <EmojiGrid
            groups={filtered}
            value={value}
            onChange={(e) => {
              onChange(e)
              setOpen(false)
              setQuery('')
            }}
          />
          {filtered.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No emoji found
            </div>
          )}
        </ScrollArea>
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

const EMOJI_KEYWORDS: Record<string, string[]> = {
  '📕': ['book', 'read', 'study'],
  '🎒': ['bag', 'school', 'backpack'],
  '📚': ['books', 'library', 'study', 'docs'],
  '🚀': ['rocket', 'launch', 'ship', 'startup'],
  '⚡': ['zap', 'energy', 'fast', 'focus', 'power'],
  '✅': ['check', 'done', 'complete', 'success', 'task'],
  '🧠': ['brain', 'think', 'idea', 'ai', 'mind'],
  '🛠️': ['tools', 'build', 'fix', 'maintenance'],
  '📌': ['pin', 'important', 'bookmark'],
  '📝': ['memo', 'note', 'write', 'task'],
  '💼': ['briefcase', 'work', 'business'],
  '📦': ['package', 'box', 'release', 'ship'],
  '😀': ['smile', 'happy', 'face', 'grin'],
  '😃': ['smile', 'happy', 'face', 'grin'],
  '😄': ['smile', 'happy', 'face', 'laugh'],
  '😁': ['smile', 'happy', 'face', 'grin'],
  '😆': ['laugh', 'happy', 'face'],
  '😅': ['sweat', 'laugh', 'happy', 'face'],
  '🤣': ['laugh', 'lol', 'funny'],
  '😂': ['laugh', 'tears', 'funny'],
  '🙂': ['smile', 'happy', 'face'],
  '🙃': ['upside down', 'smile', 'face'],
  '😉': ['wink', 'smile', 'face'],
  '😊': ['smile', 'happy', 'blush', 'face'],
  '😍': ['love', 'heart', 'eyes', 'face'],
  '🤩': ['star', 'excited', 'face'],
  '😘': ['kiss', 'love', 'face'],
  '😗': ['kiss', 'face'],
  '🤔': ['think', 'question', 'face'],
  '😌': ['relief', 'calm', 'face'],
  '😎': ['cool', 'sunglasses', 'face'],
  '🥳': ['party', 'celebrate', 'face'],
  '🤝': ['handshake', 'team', 'deal'],
  '🙌': ['hands', 'celebrate', 'win'],
  '👏': ['clap', 'applause', 'done'],
  '💪': ['strong', 'strength', 'muscle'],
  '🏢': ['office', 'building', 'company'],
  '🎯': ['target', 'goal', 'focus'],
  '💡': ['idea', 'lightbulb', 'insight'],
  '🔥': ['fire', 'hot', 'streak', 'urgent'],
  '⭐': ['star', 'favorite', 'important'],
  '🔑': ['key', 'access', 'secret'],
  '💎': ['gem', 'diamond', 'premium'],
  '🧭': ['compass', 'direction', 'navigation'],
  '📈': ['chart', 'growth', 'up', 'trend'],
  '📉': ['chart', 'down', 'trend'],
  '📊': ['chart', 'report', 'analytics'],
  '💻': ['computer', 'laptop', 'code', 'development', 'dev'],
  '🖥️': ['computer', 'desktop', 'monitor', 'screen'],
  '🔧': ['tool', 'wrench', 'fix'],
  '⚙️': ['gear', 'settings', 'config'],
  '🐛': ['bug', 'debug', 'issue'],
  '🔍': ['search', 'find', 'inspect'],
  '🧪': ['test', 'experiment', 'lab'],
  '🧬': ['dna', 'science', 'experiment'],
  '🛰️': ['satellite', 'space', 'remote'],
  '⌨️': ['keyboard', 'computer', 'type'],
  '🖱️': ['mouse', 'computer', 'click'],
  '🔒': ['lock', 'security', 'private'],
  '🧱': ['brick', 'block', 'build'],
  '📁': ['folder', 'project', 'file'],
  '📂': ['folder', 'open', 'project'],
  '🗃️': ['archive', 'box', 'files'],
  '📋': ['clipboard', 'list', 'tasks'],
  '📄': ['document', 'file', 'page'],
  '📑': ['tabs', 'document', 'files'],
  '🗒️': ['notepad', 'notes'],
  '📔': ['notebook', 'book', 'notes'],
  '📓': ['notebook', 'notes'],
  '🗄️': ['cabinet', 'archive', 'database'],
  '🧾': ['receipt', 'invoice', 'paper'],
  '📎': ['paperclip', 'attach'],
  '🗂️': ['files', 'folder', 'organize'],
  '🪄': ['magic', 'sparkle', 'wizard'],
  '🎨': ['art', 'design', 'palette'],
  '✏️': ['pencil', 'write', 'edit'],
  '🖌️': ['paint', 'brush', 'design'],
  '🧵': ['thread', 'string'],
  '🧲': ['magnet', 'attract'],
  '🕹️': ['joystick', 'game'],
  '🎧': ['headphones', 'audio', 'music'],
  '📷': ['camera', 'photo'],
  '📱': ['phone', 'mobile'],
  '🕰️': ['clock', 'time'],
  '📡': ['antenna', 'signal'],
  '🔋': ['battery', 'power'],
  '💿': ['disc', 'storage'],
  '🔔': ['bell', 'notification'],
  '🕯️': ['candle', 'light'],
  '🧰': ['toolbox', 'tools'],
  '🌱': ['plant', 'seed', 'growth'],
  '🌿': ['herb', 'leaf', 'nature'],
  '🍃': ['leaf', 'nature'],
  '🌲': ['tree', 'nature'],
  '🌸': ['flower', 'spring'],
  '🌺': ['flower', 'hibiscus'],
  '🌻': ['sunflower', 'flower'],
  '🌙': ['moon', 'night'],
  '☀️': ['sun', 'day'],
  '🌊': ['wave', 'water', 'sea'],
  '🌍': ['earth', 'world', 'globe'],
  '🌈': ['rainbow', 'color'],
  '🌩️': ['storm', 'lightning'],
  '❄️': ['snow', 'cold'],
  '🍀': ['clover', 'luck'],
}

function emojiMatchesQuery(emoji: string, groupLabel: string, query: string): boolean {
  const keywords = EMOJI_KEYWORDS[emoji] ?? []
  return (
    emoji.includes(query) ||
    groupLabel.toLowerCase().includes(query) ||
    keywords.some((keyword) => keyword.includes(query))
  )
}

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
