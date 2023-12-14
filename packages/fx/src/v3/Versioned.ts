import type { Effect } from "effect"
import type { Fx } from "./Fx"
import { FxEffectBase } from "./internal/protos"
import type { Sink } from "./Sink"

export interface Versioned<R1, E1, R2, E2, A2, R3, E3, A3> extends Fx<R2, E2, A2>, Effect.Effect<R3, E3, A3> {
  readonly version: Effect.Effect<R1, E1, number>
}

export namespace Versioned {
  /**
   * @category models
   * @since 1.0.0
   */
  export type Unify<T> = T extends
    Versioned<infer R1, infer E1, infer R2, infer E2, infer A2, infer R3, infer E3, infer A3> | infer _
    ? Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
    : never
}

export function make<R1, E1, R2, E2, A2, R3, E3, A3>(
  version: Effect.Effect<R1, E1, number>,
  fx: Fx<R2, E2, A2>,
  effect: Effect.Effect<R3, E3, A3>
): Versioned<R1, E1, R2, E2, A2, R3, E3, A3> {
  return new VersionedImpl(version, fx, effect)
}

class VersionedImpl<R1, E1, R2, E2, A2, R3, E3, A3> extends FxEffectBase<R2, E2, A2, R3, E3, A3>
  implements Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
{
  constructor(
    readonly version: Effect.Effect<R1, E1, number>,
    readonly fx: Fx<R2, E2, A2>,
    readonly effect: Effect.Effect<R3, E3, A3>
  ) {
    super()
  }

  run<R3>(sink: Sink<R3, E2, A2>): Effect.Effect<R2 | R3, never, unknown> {
    return this.fx.run(sink)
  }

  toEffect(): Effect.Effect<R3, E3, A3> {
    return this.effect
  }
}
