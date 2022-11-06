import { Wire } from '@webreflection/uwire'

import { Entry } from './Entry.js'

export interface RenderCache<R> {
  entry: Entry<R> | null
  wire: Node | DocumentFragment | Wire | null

  readonly stack: Array<RenderCache<unknown> | null>
}

export function RenderCache<R>(): RenderCache<R> {
  return {
    entry: null,
    wire: null,
    stack: [],
  }
}
