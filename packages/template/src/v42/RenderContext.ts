/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import type { Layer } from "effect"
import { Effect } from "effect"
import type { RenderCache } from "./RenderCache.js"
import type { TemplateEntry } from "./TemplateEntry.js"

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export interface RenderContext {
  /**
   * Cache for root Node's being rendered into.
   */
  readonly renderCache: WeakMap<object, RenderCache>

  /**
   * Cache for individual templates.
   */
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateEntry>
}

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export const RenderContext: Context.Tagged<RenderContext, RenderContext> = Context.Tagged<RenderContext>(
  "@typed/template/RenderContext"
)

/**
 * @since 1.0.0
 */
export function make(): RenderContext {
  return {
    renderCache: new WeakMap(),
    templateCache: new WeakMap()
  }
}

/**
 * @since 1.0.0
 */
export const layer: Layer.Layer<RenderContext> = RenderContext.layer(Effect.sync(make))
