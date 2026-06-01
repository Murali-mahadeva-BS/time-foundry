import { useState, useRef } from 'react'
import { View, TextInput, TouchableOpacity, ScrollView, Text, StyleSheet } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useSettingsStore } from '../../stores/settings.store'
import { Bold, Italic, List, Heading2, Code, Eye, Edit3 } from 'lucide-react-native'

interface MarkdownEditorProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, placeholder = 'Write notes… (Markdown supported)' }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const primary = useSettingsStore((s) => s.primaryColor)

  function insert(before: string, after = '') {
    inputRef.current?.focus()
    // Append at end for simplicity — TextInput selection API is limited on Android
    onChange(value + before + after)
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => insert('**', '**')}>
          <Bold size={16} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => insert('_', '_')}>
          <Italic size={16} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => insert('\n## ')}>
          <Heading2 size={16} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => insert('\n- ')}>
          <List size={16} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => insert('`', '`')}>
          <Code size={16} color="#475569" />
        </TouchableOpacity>
        <View style={styles.toolbarSep} />
        <TouchableOpacity
          style={[styles.toolBtn, preview && { backgroundColor: `${primary}18` }]}
          onPress={() => setPreview(!preview)}
        >
          {preview ? <Edit3 size={16} color={primary} /> : <Eye size={16} color="#475569" />}
        </TouchableOpacity>
      </View>

      {preview ? (
        <ScrollView style={styles.preview} contentContainerStyle={{ padding: 16 }}>
          {value.trim() ? (
            <Markdown
              style={{
                body: { fontSize: 14, color: '#0f172a', lineHeight: 22 },
                heading2: { fontSize: 16, fontWeight: '700', marginVertical: 8 },
                heading3: { fontSize: 15, fontWeight: '600', marginVertical: 6 },
                strong: { fontWeight: '700' },
                em: { fontStyle: 'italic' },
                code_inline: { backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace' },
                fence: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 13 },
                bullet_list: { marginLeft: 16 },
                ordered_list: { marginLeft: 16 },
                blockquote: { borderLeftWidth: 3, borderLeftColor: '#e2e8f0', paddingLeft: 12, color: '#64748b' },
              }}
            >
              {value}
            </Markdown>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>{placeholder}</Text>
          )}
        </ScrollView>
      ) : (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 2,
  },
  toolBtn: { padding: 6, borderRadius: 6 },
  toolbarSep: { flex: 1 },
  input: {
    flex: 1,
    minHeight: 200,
    padding: 14,
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 22,
    fontFamily: 'monospace',
    backgroundColor: '#ffffff',
  },
  preview: { flex: 1, backgroundColor: '#ffffff' },
})
