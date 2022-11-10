import { Runtime } from '@effect/core/io/Runtime'
import { Env } from '@tsplus/stdlib/service/Env'

import type { Hole } from './Hole.js'
import type { Renderable } from './Renderable.js'
import { TemplateCache } from './TemplateCache.js'
import type { Wire } from './Wire.js'
import { parseUpdates } from './parseUpdates.js'

export interface Entry {
  readonly type: 'svg' | 'html'
  readonly template: TemplateStringsArray
  readonly content: DocumentFragment
  readonly updates: ReadonlyArray<<R>(value: Renderable.Value<R>, runtime: Runtime<R>) => void>

  env: Env<any>
  runtime: Runtime<any> | null
  wire: Node | DocumentFragment | Wire | null
}

export function makeEntry(
  hole: Hole,
  document: Document,
  templateCache: WeakMap<TemplateStringsArray, TemplateCache>,
) {
  const { content, updates } = parseUpdates(hole, document, templateCache)

  const entry: Entry = {
    type: hole.type,
    template: hole.template,
    env: hole.env,
    runtime: null,
    content,
    updates,
    wire: null,
  }

  return entry
}
