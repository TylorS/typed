import * as Effect from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import { ToFx } from "@typed/fx/internal/fx-primitive"
import { type ModuleAgumentedEffectKeysToOmit, Variance } from "@typed/fx/internal/protos"

/**
 * Prototype for creqting a type which is both an Effect and an Fx
 */
export abstract class FxEffectProto<R, E, A, R2, E2, B> extends ToFx<R, E, A>
  implements Omit<Effect.Effect<R2, E2, B>, ModuleAgumentedEffectKeysToOmit>, Fx<R, E, A>
{
  readonly _tag = "Commit"

  readonly [Effect.EffectTypeId] = Variance as any

  protected abstract toEffect(): Effect.Effect<R2, E2, B>

  #effect: Effect.Effect<R2, E2, B> | undefined

  commit(): Effect.Effect<R2, E2, B> {
    if (this.#effect === undefined) {
      return (this.#effect = this.toEffect())
    } else {
      return this.#effect
    }
  }
}
