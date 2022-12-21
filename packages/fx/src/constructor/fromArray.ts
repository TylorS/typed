import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

export function fromArray<A extends ReadonlyArray<any>>(array: A): Fx<never, never, A[number]> {
  return new FromArrayFx(array)
}

class FromArrayFx<A extends ReadonlyArray<any>>
  extends Fx.Variance<never, never, A[number]>
  implements Fx<never, never, A[number]>
{
  constructor(readonly array: A) {
    super()
  }

  run<R2>(sink: Sink<R2, never, A>) {
    return pipe(this.array, Effect.forEachDiscard(sink.event), Effect.zipRight(sink.end))
  }
}
