import type { Fx } from "@typed/fx/Fx"
import { succeed } from "@typed/fx/internal/core"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { FxEffectBase } from "@typed/fx/internal/protos"
import type { Versioned } from "@typed/fx/Versioned"
import * as Effect from "effect/Effect"

/**
 * Construct a Versioned type.
 * @since 1.18.0
 * @category constructors
 */
export function makeVersioned<R0, R, E, A, R2, E2, B>(
  { effect, fx, version }: {
    version: Effect.Effect<R0, never, number>
    fx: Fx<R, E, A>
    effect: Effect.Effect<R2, E2, B>
  }
): Versioned<R0, R, E, A, R2, E2, B> {
  return new VersionedImpl(version, fx, effect) as any
}

/**
 * Construct a Versioned type from a static value.
 * @since 1.18.0
 * @category constructors
 */
export function versionedOf<A>(value: A): Versioned<never, never, never, A, never, never, A> {
  return makeVersioned({
    effect: Effect.succeed(value),
    fx: succeed(value),
    version: Effect.succeed(1)
  })
}

export class VersionedImpl<R0, R, E, A, R2, E2, B> extends FxEffectBase<R, E, A, R2, E2, B>
  implements Omit<Versioned<R0, R, E, A, R2, E2, B>, ModuleAgumentedEffectKeysToOmit>
{
  constructor(
    readonly i0: Effect.Effect<R0, never, number>,
    readonly i1: Fx<R, E, A>,
    readonly i2: Effect.Effect<R2, E2, B>
  ) {
    super()
  }

  protected toEffect(): Effect.Effect<R2, E2, B> {
    return this.i2
  }

  protected toFx(): Fx<R, E, A> {
    return this.i1
  }

  version = this.i0
}
