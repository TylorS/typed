import * as Effect from '@effect/io/Effect'
import { RuntimeFlagsPatch } from '@effect/io/Fiber/Runtime/Flags/Patch'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function withRuntimeFlags(patch: RuntimeFlagsPatch) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new WithRuntimeFlagsFx(fx, patch)
}

export class WithRuntimeFlagsFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly patch: RuntimeFlagsPatch) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(this.fx.run(sink), Effect.withRuntimeFlags(this.patch))
  }
}
