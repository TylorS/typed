import type { Wire } from '@typed/wire'

export interface RenderCache {
  wire: Node | DocumentFragment | Wire | null | undefined
}

export function RenderCache(): RenderCache {
  return {
    wire: null,
  }
}
