import { Runtime } from '@effect/io/Runtime'
import { Context } from '@fp-ts/data/Context'

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

  context: Context<any>
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
    context: hole.context,
    runtime: null,
    content,
    updates,
    wire: null,
  }

  return entry
}