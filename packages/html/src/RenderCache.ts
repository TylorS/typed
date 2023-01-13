import type { Entry } from './Entry.js'
import type { Wire } from './Wire.js'

export interface RenderCache {
  entry: Entry | null
  wire: Node | DocumentFragment | Wire | null | undefined

  readonly stack: Array<RenderCache | null>
}

export function RenderCache(): RenderCache {
  return {
    entry: null,
    wire: null,
    stack: [],
  }
}
