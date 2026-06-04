import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { ScrollArea } from './scroll-area'
import { cn } from '../../lib/utils'

const EMOJI_GROUPS = {
  'Work': ['💼', '🏢', '⚡', '🚀', '🎯', '💡', '🔥', '⭐', '✅', '📌'],
  'Development': ['💻', '🖥️', '🔧', '⚙️', '🛠️', '📦', '🐛', '🔍', '📊', '🗂️'],
  'Project': ['📁', '📂', '🗃️', '📋', '📝', '📄', '📑', '🗒️', '📔', '📓'],
  'Design': ['🎨', '✏️', '🖌️', '🎭', '🖼️', '💎', '🌈', '🎪', '🎠', '🌟'],
  'Team': ['👤', '👥', '🤝', '🏆', '🎖️', '🎗️', '🎁', '🎉', '🎊', '🥇'],
  'Nature': ['🌱', '🌿', '🍃', '🌲', '🌸', '🌺', '🌻', '🌙', '☀️', '🌊'],
}

interface EmojiPickerProps {
  value?: string
  onChange: (emoji: string) => void
  children: React.ReactNode
}

export function EmojiPicker({ value, onChange, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const groups = Object.entries(EMOJI_GROUPS)
    .map(([group, emojis]) => ({
      group,
      emojis: normalizedQuery
        ? emojis.filter((emoji) => emojiMatchesQuery(emoji, group, normalizedQuery))
        : emojis,
    }))
    .filter(({ emojis }) => emojis.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emojis"
            className="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <ScrollArea className="h-72 p-3">
          <div className="space-y-3">
            {groups.map(({ group, emojis }) => (
              <div key={group}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group}</p>
                <div className="grid grid-cols-10 gap-0.5">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onChange(emoji)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-accent',
                        value === emoji && 'bg-accent ring-1 ring-ring',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No emoji found
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

const EMOJI_KEYWORDS: Record<string, string[]> = {
  '😀': ['smile', 'happy', 'face'],
  '😃': ['smile', 'happy', 'face'],
  '😄': ['smile', 'happy', 'face'],
  '😁': ['smile', 'happy', 'face'],
  '🙂': ['smile', 'happy', 'face'],
  '😊': ['smile', 'happy', 'face'],
  '💻': ['computer', 'laptop', 'code', 'development'],
  '🖥️': ['computer', 'desktop', 'monitor', 'screen'],
  '⌨️': ['computer', 'keyboard', 'type'],
  '🖱️': ['computer', 'mouse', 'click'],
  '💼': ['work', 'briefcase', 'business'],
  '🏢': ['office', 'building', 'company'],
  '⚡': ['zap', 'fast', 'focus', 'energy'],
  '🚀': ['rocket', 'launch'],
  '🎯': ['target', 'goal', 'focus'],
  '💡': ['idea', 'lightbulb'],
  '🔥': ['fire', 'streak', 'urgent'],
  '⭐': ['star', 'favorite'],
  '✅': ['done', 'check', 'complete'],
  '📌': ['pin', 'important'],
  '🔧': ['tool', 'wrench', 'fix'],
  '⚙️': ['gear', 'settings'],
  '🛠️': ['tools', 'build', 'fix'],
  '📦': ['package', 'box', 'ship'],
  '🐛': ['bug', 'debug'],
  '🔍': ['search', 'find'],
  '📊': ['chart', 'report'],
  '🗂️': ['files', 'folder'],
  '📁': ['folder', 'project'],
  '📂': ['folder', 'open'],
  '📋': ['clipboard', 'list'],
  '📝': ['memo', 'note', 'write'],
  '📄': ['document', 'file'],
  '📚': ['books', 'docs', 'library'],
  '🎨': ['art', 'design', 'palette'],
  '✏️': ['pencil', 'write'],
  '🖌️': ['paint', 'brush'],
}

function emojiMatchesQuery(emoji: string, groupLabel: string, query: string): boolean {
  const keywords = EMOJI_KEYWORDS[emoji] ?? []
  return (
    emoji.includes(query) ||
    groupLabel.toLowerCase().includes(query) ||
    keywords.some((keyword) => keyword.includes(query))
  )
}
