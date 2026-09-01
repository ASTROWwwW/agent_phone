import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./NotesRichTextEditor.vue', import.meta.url),
  'utf8',
)

describe('NotesRichTextEditor formatting tabbar', () => {
  it('lists every formatting action through shared tabbar primitives', () => {
    expect(source.match(/<AgentTabBar\b/g)).toHaveLength(1)
    expect(source.match(/<AgentTabButton\b/g)).toHaveLength(13)
    expect(source).toContain(
      "import { AgentIcon, AgentTabBar, AgentTabButton } from '@/ui'",
    )
    expect(source).toContain(
      '<AgentTabBar v-if="editor" :label="labels.toolbar" :labels="false">',
    )
    expect(source).toContain('<template v-if="!formatMode">')
    expect(source).toContain('@click="formatMode = true"')
    expect(source).toContain('@click="formatMode = false"')
    expect(source).toContain(':disabled="editor.state.selection.empty"')
    expect(source).toContain('class="notes-rich-editor agent-ui-provider"')
    expect(source).toContain("'agent-ui-provider--dark': dark")
    expect(source).not.toContain('notes-rich-editor__toolbar-row')
    expect(source).not.toContain('scrollToolbar')
  })
})
