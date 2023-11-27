/**
 * @since 1.0.0
 */
import type { Fx } from "@typed/fx/Fx"
import type { Rendered } from "@typed/wire"
import type { Effect } from "effect/Effect"
import type { Placeholder } from "./Placeholder"
import type { RenderEvent } from "./RenderEvent"

/**
 * @since 1.0.0
 */
export type Renderable<R = never, E = never> =
  | Renderable.Value
  | { readonly [key: string]: Renderable.Value } // TODO: Should we manage data attributes this way?
  | Placeholder<R, E, any>
  | Effect<R, E, any>
  | Fx<R, E, any>
  | ReadonlyArray<Renderable<R, E>>

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
