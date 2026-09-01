import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./RangeSliderDemo.vue', import.meta.url),
  'utf8',
)
const controls = readFileSync(
  new URL('../../../../ui/controls.css', import.meta.url),
  'utf8',
)

describe('RangeSliderDemo', () => {
  it('keeps the Konsta title, header and inset-list sequence', () => {
    expect(source).toMatch(
      /<AgentBlockTitle>Volume: \{\{ volume \}\}<\/AgentBlockTitle>\s*<AgentBlockHeader>From 0 to 100 with step 10<\/AgentBlockHeader>\s*<AgentList inset strong>/,
    )
    expect(source).toMatch(
      /<AgentBlockTitle>Price: \$\{\{ price \}\}<\/AgentBlockTitle>\s*<AgentBlockHeader>From 0 to 1000 with step 1<\/AgentBlockHeader>\s*<AgentList inset strong>/,
    )
    expect(source).toMatch(
      /<AgentBlockTitle>\s*Color: rgb\(\{\{ red \}\}, \{\{ green \}\}, \{\{ blue \}\}\)\s*<\/AgentBlockTitle>\s*<AgentList inset strong>/,
    )
  })

  it('locks the Chrome 103-safe eight-pixel Konsta block rhythm', () => {
    expect(controls).toMatch(
      /\.agent-block-title \+ \.agent-block,[\s\S]*?\.agent-block-title \+ \.agent-block-header,[\s\S]*?\.agent-block-title \+ \.agent-list,[\s\S]*?\{\s*margin-top:\s*8px;/,
    )
    expect(controls).toMatch(
      /\.agent-block-header\s*\{[^}]*margin:\s*32px 0 -24px;/s,
    )
    expect(controls).toMatch(/\.agent-list\s*\{[^}]*margin:\s*32px 0;/s)
  })
})
