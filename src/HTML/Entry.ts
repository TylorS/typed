import * as Effect from '@effect/core/io/Effect'

import type { Hole } from './Hole.js'
import type { Wire } from './Wire.js'
import { parseUpdates } from './parseUpdates.js'

export interface Entry {
  readonly type: 'svg' | 'html'
  readonly template: TemplateStringsArray
  readonly content: DocumentFragment
  readonly updates: ReadonlyArray<(value: unknown) => Effect.Effect<never, never, void>>
  wire: Node | DocumentFragment | Wire | null
}

export function makeEntry(hole: Hole) {
  return Effect.gen(function* ($) {
    const { content, updates } = yield* $(parseUpdates(hole))

    const entry: Entry = {
      type: hole.type,
      template: hole.template,
      content,
      updates,
      wire: null,
    }

    return entry
  })
}
