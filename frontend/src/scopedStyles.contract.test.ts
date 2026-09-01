import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compileStyle } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

const sourceDirectory = fileURLToPath(new URL('.', import.meta.url))

function componentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return componentFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

describe('scoped style contract', () => {
  it('confirms the compiler drops the descendant part of :global(x) y', () => {
    const compiled = compileStyle({
      filename: 'contract.vue',
      id: 'data-v-contract',
      scoped: true,
      source: ':global(.outer) .inner { color: red; }',
    })
    expect(compiled.code).not.toContain('.inner')
  })
  it('never leaves a selector after a :global() prefix', () => {
    const offenders = componentFiles(sourceDirectory)
      .filter((file) =>
        /:global\([^)]*\)\s+[.#[a-zA-Z]/.test(readFileSync(file, 'utf8')),
      )
      .map((file) => file.slice(sourceDirectory.length))
    expect(offenders).toEqual([])
  })
})