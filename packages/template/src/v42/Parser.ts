import type { RenderContext } from "./RenderContext.js"

export interface Parser<T> {
  (template: ReadonlyArray<string>, ctx: RenderContext): T
}
