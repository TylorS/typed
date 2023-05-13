import type { Trace } from "@effect/data/Debug"
import type { Effect } from "@effect/io/Effect"
import { matchCauseEffect } from "@effect/io/Effect"
import type { Fx, Sink } from "@typed/fx/Fx"
import { BaseFx } from "@typed/fx/Fx"

export function fromEffect<R, E, A>(effect: Effect<R, E, A>): Fx<R, E, A> {
  return new FromEffect(effect)
}

export class FromEffect<R, E, A> extends BaseFx<R, E, A> {
  constructor(readonly effect: Effect<R, E, A>, readonly trace?: Trace) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return matchCauseEffect(this.effect, sink.error, sink.event).traced(
      this.trace,
    )
  }
}
