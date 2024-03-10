/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import { type DomServices, domServices, type DomServicesElementParams } from "@typed/dom/DomServices"
import { GlobalThis } from "@typed/dom/GlobalThis"
import { Window } from "@typed/dom/Window"
import type { Environment } from "@typed/environment"
import { CurrentEnvironment } from "@typed/environment"
import type { Rendered } from "@typed/wire"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type { Entry } from "./Entry.js"
import type * as RenderQueue from "./RenderQueue.js"

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export interface RenderContext {
  /**
   * The current environment we are rendering within
   */
  readonly environment: Environment

  /**
   * Cache for root Node's being rendered into.
   */
  readonly renderCache: WeakMap<object, Rendered | null>

  /**
   * Cache for individual templates.
   */
  readonly templateCache: WeakMap<TemplateStringsArray, Entry>
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
export type RenderContextOptions = {
  readonly environment: Environment
}

/**
 * @since 1.0.0
 */
export function make({
  environment
}: RenderContextOptions): RenderContext {
  return {
    environment,
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
export function getTemplateCache(
  templateCache: RenderContext["templateCache"],
  key: TemplateStringsArray
): Option.Option<Entry> {
  return Option.fromNullable(templateCache.get(key))
}

const buildWithCurrentEnvironment = (environment: Environment) =>
  Layer.mergeAll(
    RenderContext.layer(make({ environment })),
    CurrentEnvironment.layer(environment)
  )

/**
 * @since 1.0.0
 */
export const dom: (
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
) => Layer.Layer<RenderContext | CurrentEnvironment | DomServices, never, RenderQueue.RenderQueue> = (
  window,
  options
) =>
  Layer.provideMerge(
    Layer.mergeAll(
      buildWithCurrentEnvironment("dom"),
      domServices(options)
    ),
    Layer.mergeAll(Window.layer(window), GlobalThis.layer(window))
  )

/**
 * @since 1.0.0
 */
export const server: Layer.Layer<RenderContext | CurrentEnvironment> = buildWithCurrentEnvironment(
  "server"
)

const static_: Layer.Layer<RenderContext | CurrentEnvironment> = buildWithCurrentEnvironment("static")

export {
  /**
   * @since 1.0.0
   */
  static_ as static
}
