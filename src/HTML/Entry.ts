import * as Effect from '@effect/core/io/Effect'
import { Env } from '@tsplus/stdlib/service/Env'
import type { Wire } from '@webreflection/uwire'

import type { Hole } from './Hole.js'
import type { Placeholder } from './Placeholder.js'
import { parseUpdates } from './parseUpdates.js'

export interface Entry {
  readonly type: 'svg' | 'html'
  readonly template: TemplateStringsArray
  readonly content: DocumentFragment
  readonly updates: ReadonlyArray<
    <R>(value: Placeholder<R>) => Effect.Effect<R | Document, never, void>
  >

  env: Env<any>
  wire: Node | DocumentFragment | Wire | null
}

export function makeEntry(hole: Hole) {
  return Effect.gen(function* ($) {
    const { content, updates } = yield* $(parseUpdates(hole))

    const entry: Entry = {
      type: hole.type,
      template: hole.template,
      env: hole.env,
      content,
      updates,
      wire: null,
    }

    return entry
  })
}
