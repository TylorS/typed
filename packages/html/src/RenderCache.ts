import type { Wire } from './Wire.js'

export interface RenderCache {
  wire: Node | DocumentFragment | Wire | null | undefined
}

export function RenderCache(): RenderCache {
  return {
    wire: null,
  }
}
