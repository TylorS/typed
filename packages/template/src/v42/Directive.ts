import type { Effect } from "effect"
import type { Cause } from "effect/Cause"
import type { Scope } from "effect/Scope"
import type { Part } from "./internal/part.js"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"

/**
 * @since 1.0.0
 */
export const DirectiveTypeId = Symbol.for("@typed/template/Directive")

/**
 * @since 1.0.0
 */
export type DirectiveTypeId = typeof DirectiveTypeId

/**
 * @since 1.0.0
 */
export interface Directive<A = unknown, E = never, R = never> extends Placeholder<A, E, R> {
  readonly [DirectiveTypeId]: (
    part: Part<A>,
    onCause: (cause: Cause<E>) => Effect.Effect<unknown>
  ) => Effect.Effect<unknown, never, R | RenderQueue | RenderContext | Scope>
}
