import type * as Context from '@effect/data/Context'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function provideService<I, S>(tag: Context.Tag<I, S>) {
  return (service: S) => {
    return <R, E, A>(self: Fx<R | I, E, A>): Fx<Exclude<R, I>, E, A> =>
      new ProvideServiceFx(self, tag, service)
  }
}

class ProvideServiceFx<R, E, A, I, S>
  extends Fx.Variance<Exclude<R, I>, E, A>
  implements Fx<Exclude<R, I>, E, A>
{
  constructor(
    readonly self: Fx<R | I, E, A>,
    readonly tag: Context.Tag<I, S>,
    readonly service: S,
  ) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(this.self.run(sink), Effect.provideService(this.tag, this.service))
  }
}
