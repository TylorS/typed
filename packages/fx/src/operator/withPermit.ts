import type { Effect, Semaphore } from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'

export function withPermit(semaphore: Semaphore) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new WithPermitFx(fx, semaphore)
}

class WithPermitFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly semaphore: Semaphore) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>): Effect<R | R2 | Scope, never, unknown> {
    return pipe(this.fx.run(sink), this.semaphore.withPermits(1))
  }
}
