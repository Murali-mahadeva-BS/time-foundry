import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'
import MarkdownIt from 'markdown-it'
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon,
  Code2, Table as TableIcon, Undo2, Redo2, Quote, Minus, Plus, Trash2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

const lowlight = createLowlight(common)
const md = new MarkdownIt({ linkify: true, breaks: true, html: false })

// Extend CodeBlockLowlight to expose the language as data-language on <pre>
// so the CSS ::before badge can read it via content: attr(data-language)
const CodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: (el) =>
          el.querySelector('code')?.className.replace('language-', '') ?? null,
        renderHTML: (attrs) => ({
          'data-language': attrs.language ?? 'plaintext',
        }),
      },
    }
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write notes, links, acceptance criteria… (## heading, - list, **bold**, paste images)',
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const clearHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [controlsHover, setControlsHover] = useState(false)
  const [hoverRow, setHoverRow] = useState<{ top: number; left: number; pos: number } | null>(null)
  const [hoverCol, setHoverCol] = useState<{ left: number; top: number; pos: number } | null>(null)

  // Keep onChange ref stable so the timer callback always calls the latest version
  // without needing to be listed as an effect dependency (avoids stale closures)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      CodeBlock.configure({ lowlight, defaultLanguage: 'plaintext' }),
      Link.configure({
        autolink: true,
        openOnClick: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    // content is ONLY used on mount — never synced back via useEffect.
    // The parent must use key={taskId} to remount when switching tasks.
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onChangeRef.current(editor.getHTML())
      }, 600)
    },
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            const reader = new FileReader()
            reader.onload = (e) => {
              const src = e.target?.result as string
              if (src) {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src }),
                  ),
                )
              }
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        const plainText = event.clipboardData?.getData('text/plain') ?? ''
        const hasMarkdown = /(^|\n)\s*(#{1,6}\s|[-*]\s|\d+\.\s|```|\|.+\|)|\*\*.+\*\*|\[.+\]\(.+\)|\[[^\]]+\]\[[^\]]*\]|\[[^\]]+\]:\s*\S+/m.test(plainText)
        if (plainText && hasMarkdown) {
          event.preventDefault()
          const html = md.render(plainText)
          const container = document.createElement('div')
          container.innerHTML = html
          const slice = PMDOMParser.fromSchema(view.state.schema).parseSlice(container)
          view.dispatch(view.state.tr.replaceSelection(slice))
          return true
        }
        return false
      },
    },
  })

  // Flush pending save on unmount so no content is lost when navigating away
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
        if (editor) onChangeRef.current(editor.getHTML())
      }
    }
  }, [editor])

  return (
    <div
      ref={rootRef}
      onBlur={() => {
        // Also flush when focus leaves the editor area
        if (saveTimer.current) {
          clearTimeout(saveTimer.current)
          saveTimer.current = null
          if (editor) onChangeRef.current(editor.getHTML())
        }
      }}
      onMouseMove={(e) => {
        if (!rootRef.current || !editor) return
        if (clearHoverTimerRef.current) {
          clearTimeout(clearHoverTimerRef.current)
          clearHoverTimerRef.current = null
        }
        const target = e.target as HTMLElement
        const cell = target.closest('td,th') as HTMLElement | null
        const table = target.closest('table') as HTMLElement | null
        if (!cell || !table) {
          if (controlsHover) return
          clearHoverTimerRef.current = setTimeout(() => {
            setHoverRow(null)
            setHoverCol(null)
          }, 140)
          return
        }
        const rowEl = cell.parentElement as HTMLTableRowElement | null
        if (!rowEl) return
        const rootRect = rootRef.current.getBoundingClientRect()
        const rowRect = rowEl.getBoundingClientRect()
        const cellRect = cell.getBoundingClientRect()
        const tableRect = table.getBoundingClientRect()
        const pos = editor.view.posAtDOM(cell, 0)
        setHoverRow({
          top: rowRect.top - rootRect.top + rowRect.height / 2,
          left: tableRect.left - rootRect.left,
          pos,
        })
        setHoverCol({
          left: cellRect.left - rootRect.left + cellRect.width / 2,
          top: tableRect.top - rootRect.top,
          pos,
        })
      }}
      onMouseLeave={() => {
        if (controlsHover) return
        clearHoverTimerRef.current = setTimeout(() => {
          setHoverRow(null)
          setHoverCol(null)
        }, 140)
      }}
      className={cn(
        'relative prose prose-sm dark:prose-invert max-w-none',
        '[&_.tiptap]:outline-none [&_.tiptap]:min-h-60',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
        '[&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md [&_.tiptap_img]:my-2',
        '[&_.tiptap_table]:w-full [&_.tiptap_table]:table-fixed [&_.tiptap_table]:border-collapse [&_.tiptap_th]:border [&_.tiptap_td]:border [&_.tiptap_th]:p-2 [&_.tiptap_td]:p-2 [&_.tiptap_th]:align-top [&_.tiptap_td]:align-top [&_.tiptap_th]:break-words [&_.tiptap_td]:break-words',
        className,
      )}
    >
      {!readOnly && editor && (
        <div className="mb-3 flex flex-wrap items-center gap-1 rounded-md border bg-card p-1 not-prose">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <select
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1'
                : editor.isActive('heading', { level: 2 }) ? 'h2'
                  : editor.isActive('heading', { level: 3 }) ? 'h3'
                    : editor.isActive('heading', { level: 4 }) ? 'h4'
                      : editor.isActive('heading', { level: 5 }) ? 'h5'
                        : editor.isActive('heading', { level: 6 }) ? 'h6'
                          : 'p'
            }
            onChange={(e) => {
              const value = e.target.value
              if (value === 'p') {
                editor.chain().focus().setParagraph().run()
                return
              }
              editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run()
            }}
            className="h-8 rounded border bg-background px-2 text-xs"
          >
            <option value="p">P</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
            <option value="h5">H5</option>
            <option value="h6">H6</option>
          </select>
          <Button type="button" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const current = editor.getAttributes('link').href ?? ''
              const url = window.prompt('Enter link URL', current)
              if (url === null) return
              if (!url.trim()) {
                editor.chain().focus().unsetLink().run()
                return
              }
              editor.chain().focus().setLink({ href: url.trim() }).run()
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('table') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Plus className="h-4 w-4 rotate-45" />
          </Button>
        </div>
      )}

      {!readOnly && editor && hoverRow && (
        <div
          className="not-prose absolute z-20 flex items-center gap-1 rounded-md border bg-card p-1 shadow-sm"
          style={{ top: hoverRow.top - 16, left: hoverRow.left - 80 }}
          onMouseEnter={() => setControlsHover(true)}
          onMouseLeave={() => {
            setControlsHover(false)
            setHoverRow(null)
            setHoverCol(null)
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextSelection(hoverRow.pos + 1).addRowAfter().run()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextSelection(hoverRow.pos + 1).deleteRow().run()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {!readOnly && editor && hoverCol && (
        <div
          className="not-prose absolute z-20 flex items-center gap-1 rounded-md border bg-card p-1 shadow-sm"
          style={{ top: hoverCol.top - 44, left: hoverCol.left - 30 }}
          onMouseEnter={() => setControlsHover(true)}
          onMouseLeave={() => {
            setControlsHover(false)
            setHoverRow(null)
            setHoverCol(null)
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextSelection(hoverCol.pos + 1).addColumnAfter().run()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextSelection(hoverCol.pos + 1).deleteColumn().run()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
