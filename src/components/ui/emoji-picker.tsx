import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <div key={group}>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group}</p>
              <div className="grid grid-cols-10 gap-0.5">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onChange(emoji)
                      setOpen(false)
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
        </div>
      </PopoverContent>
    </Popover>
  )
}
