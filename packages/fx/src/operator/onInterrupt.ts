import * as Effect from '@effect/io/Effect'
import type { FiberId } from '@effect/io/Fiber/Id'
import { flow, pipe } from '@fp-ts/core/Function'
import type { HashSet } from '@fp-ts/data/HashSet'

import { Fx } from '../Fx.js'

export function onInterrupt<R2, E2, B>(
  f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => new OnInterruptFx(fx, f)
}

class OnInterruptFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (interruptors: HashSet<FiberId>) => Effect.Effect<R2, E2, B>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A>) {
    return pipe(
      this.fx.run(sink),
      Effect.onInterrupt(flow(this.f, Effect.matchCauseEffect(sink.error, Effect.unit))),
    )
  }
}
