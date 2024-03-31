import type { Rendered } from "@typed/wire"
import type { Parts } from "./Part.js"
import type { Template } from "./Template.js"

export interface RenderCache {
  template: Template
  parts: Parts
  rendered: Rendered | null
  stack: Array<RenderCache>
}

export function makeRenderCache(template: Template): RenderCache {
  return {
    template,
    parts: [],
    rendered: null,
    stack: []
  }
}
