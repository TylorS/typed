import { zipRight } from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function succeed<A>(a: A): Fx<never, never, A> {
  return new SucceedFx(a)
}

export class SucceedFx<A> extends Fx.Variance<never, never, A> implements Fx<never, never, A> {
  constructor(private readonly a: A) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, never, A>) {
    return pipe(sink.event(this.a), zipRight(sink.end))
  }
}
