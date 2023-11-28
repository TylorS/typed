import * as Effect from "effect/Effect"
import type { Fx } from "../Fx"
import type { Versioned } from "../Versioned"
import { succeed } from "./core.js"
import { FxEffectBase } from "./protos.js"

/**
 * Construct a Versioned type.
 * @since 1.18.0
 * @category constructors
 */
export function makeVersioned<R0, E0, R, E, A, R2, E2, B>(
  { effect, fx, version }: {
    version: Effect.Effect<R0, E0, number>
    fx: Fx<R, E, A>
    effect: Effect.Effect<R2, E2, B>
  }
): Versioned<R0, E0, R, E, A, R2, E2, B> {
  return new VersionedImpl(version, fx, effect) as any
}

/**
 * Construct a Versioned type from a static value.
 * @since 1.18.0
 * @category constructors
 */
export function versionedOf<A>(value: A): Versioned<never, never, never, never, A, never, never, A> {
  return makeVersioned({
    effect: Effect.succeed(value),
    fx: succeed(value),
    version: Effect.succeed(1)
  })
}

export class VersionedImpl<R0, E0, R, E, A, R2, E2, B> extends FxEffectBase<R, E, A, R2, E2, B>
  implements Versioned<R0, E0, R, E, A, R2, E2, B>
{
  version: Effect.Effect<R0, E0, number>

  constructor(
    readonly i0: Effect.Effect<R0, E0, number>,
    readonly i1: Fx<R, E, A>,
    readonly i2: Effect.Effect<R2, E2, B>
  ) {
    super()
    this.version = i0
  }

  protected toFx(): Fx<R, E, A> {
    return this.i1
  }

  protected toEffect(): Effect.Effect<R2, E2, B> {
    return this.i2
  }
}
