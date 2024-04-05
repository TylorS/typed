import type { Effect } from "effect"
import { Effectable } from "effect"
import { constant } from "effect/Function"
import type { Computed } from "../Signal"
import { DEFAULT_PRIORITY } from "../SignalQueue"
import { Signals } from "../Signals"
import { ComputedTypeId } from "./type-id"

const ComputedVariance: Computed.Variance<any, any, never> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _
}

export class ComputedImpl<A, E, R> extends Effectable.StructuralClass<A, E, R | Signals> implements Computed<A, E, R> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, R> = ComputedVariance

  readonly get: Effect.Effect<A, E, R | Signals>
  readonly commit: () => Effect.Effect<A, E, R | Signals>

  constructor(
    readonly effect: Effect.Effect<A, E, R>,
    readonly priority: number = DEFAULT_PRIORITY
  ) {
    super()

    this.get = Signals.withEffect((s) => s.getComputed<A, E, R>(this))
    this.commit = constant(this.get)
  }
}
