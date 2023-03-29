import type { Tag } from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export const serviceWithFx =
  <I, S>(tag: Tag<I, S>) =>
  <R, E, A>(f: (s: S) => Fx<R, E, A>): Fx<I | R, E, A> =>
    new ServiceWithFx(tag, f)

class ServiceWithFx<I, S, R, E, A> extends Fx.Variance<I | R, E, A> implements Fx<I | R, E, A> {
  constructor(readonly tag: Tag<I, S>, readonly f: (a: S) => Fx<R, E, A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return Effect.flatMap(this.tag, (a) => this.f(a).run(sink))
  }
}
