/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import type { Layer } from "effect"
import { Effect, Option } from "effect"

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export interface RenderContext {
  /**
   * Cache for root Node's being rendered into.
   */
  readonly renderCache: WeakMap<object, unknown>

  /**
   * Cache for individual templates.
   */
  readonly templateCache: WeakMap<TemplateStringsArray, unknown>
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
export function getRenderCache<T>(renderCache: RenderContext["renderCache"], key: object): Option.Option<T> {
  return renderCache.has(key) ? Option.some(renderCache.get(key) as T) : Option.none()
}

/**
 * @since 1.0.0
 */
export function getTemplateCache<T>(
  templateCache: RenderContext["templateCache"],
  key: TemplateStringsArray
): Option.Option<T> {
  return templateCache.has(key) ? Option.some(templateCache.get(key) as T) : Option.none()
}

/**
 * @since 1.0.0
 */
export const layer: Layer.Layer<RenderContext> = RenderContext.layer(Effect.sync(make))
