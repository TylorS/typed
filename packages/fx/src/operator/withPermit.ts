import * as TSemaphore from '@effect/stm/TSemaphore'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function withPermit(semaphore: TSemaphore.TSemaphore) {
  return <R, E, A>(fx: Fx<R, E, A>) => new WithPermitFx(fx, semaphore)
}

export class WithPermitFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly semaphore: TSemaphore.TSemaphore) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(this.fx.run(sink), TSemaphore.withPermit(this.semaphore))
  }
}