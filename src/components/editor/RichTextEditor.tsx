import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

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
      onBlur={() => {
        // Also flush when focus leaves the editor area
        if (saveTimer.current) {
          clearTimeout(saveTimer.current)
          saveTimer.current = null
          if (editor) onChangeRef.current(editor.getHTML())
        }
      }}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        '[&_.tiptap]:outline-none [&_.tiptap]:min-h-60',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
        '[&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md [&_.tiptap_img]:my-2',
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
