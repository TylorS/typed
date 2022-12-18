import * as Effect from '@effect/io/Effect'
import { Tag } from '@fp-ts/data/Context'

import { Fx } from '../Fx.js'

export const serviceWithFx =
  <T>(tag: Tag<T>) =>
  <R, E, A>(f: (t: T) => Fx<R, E, A>): Fx<T | R, E, A> =>
    new ServiceWithFx(tag, f)

export class ServiceWithFx<T, R, E, A> extends Fx.Variance<T | R, E, A> implements Fx<T | R, E, A> {
  constructor(readonly tag: Tag<T>, readonly f: (a: T) => Fx<R, E, A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return Effect.serviceWithEffect(this.tag)((a) => this.f(a).run(sink))
  }
}
