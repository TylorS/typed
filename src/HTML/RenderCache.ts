import { Entry } from './Entry.js'
import { Wire } from './Wire.js'

export interface RenderCache {
  entry: Entry | null
  wire: Node | DocumentFragment | Wire | null

  readonly stack: Array<RenderCache | null>
}

export function RenderCache(): RenderCache {
  return {
    entry: null,
    wire: null,
    stack: [],
  }
}
