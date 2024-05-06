/**
 * @since 1.0.0
 */
import type { Fx } from "@typed/fx/Fx"
import type { Rendered } from "@typed/wire"
import type { Effect } from "effect/Effect"
import type { Placeholder } from "./Placeholder.js"
import type { RenderEvent } from "./RenderEvent.js"

/**
 * @since 1.0.0
 */
export type Renderable<E = never, R = never> =
  | Renderable.Value
  | Placeholder<any, E, R>
  | { readonly [key: string]: Renderable<E, R> | Placeholder<any, E, R> | unknown } // TODO: Should we manage data attributes this way?
  | Placeholder<any, E, R>
  | Effect<any, E, R>
  | Fx<any, E, R>
  | ReadonlyArray<Renderable<E, R>>

/**
 * @since 1.0.0
 */
export namespace Renderable {
  /**
   * @since 1.0.0
   */
  export type Primitive = string | number | boolean | null | undefined | void | ReadonlyArray<Primitive>

  /**
   * @since 1.0.0
   */
  export type Value = Primitive | Rendered | RenderEvent
}
