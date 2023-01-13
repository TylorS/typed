import * as Effect from '@effect/io/Effect'
import type * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function provideService<S>(tag: Context.Tag<S>) {
  return (service: S) => {
    return <R, E, A>(self: Fx<R | S, E, A>): Fx<Exclude<R, S>, E, A> =>
      new ProvideServiceFx(self, tag, service)
  }
}

class ProvideServiceFx<R, E, A, S>
  extends Fx.Variance<Exclude<R, S>, E, A>
  implements Fx<Exclude<R, S>, E, A>
{
  constructor(readonly self: Fx<R | S, E, A>, readonly tag: Context.Tag<S>, readonly service: S) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(this.self.run(sink), Effect.provideService(this.tag)(this.service))
  }
}
