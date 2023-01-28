import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'
import * as Context from '@fp-ts/data/Context'

import { Fx } from '../Fx.js'

export function provideSomeContext<R2>(context: Context.Context<R2>) {
  return <R, E, A>(self: Fx<R, E, A>): Fx<Exclude<R, R2>, E, A> =>
    new ContramapContextFx(self, (ctx) => Context.merge(context)(ctx as Context.Context<R>))
}

export function contramapContext<R2, R>(f: (ctx: Context.Context<R2>) => Context.Context<R>) {
  return <E, A>(self: Fx<R, E, A>): Fx<R2, E, A> => new ContramapContextFx(self, f)
}

class ContramapContextFx<R, R2, E, A> extends Fx.Variance<R2, E, A> implements Fx<R2, E, A> {
  constructor(
    readonly self: Fx<R, E, A>,
    readonly f: (ctx: Context.Context<R2>) => Context.Context<R>,
  ) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E, A>) {
    const { self, f } = this

    return Effect.gen(function* ($) {
      const ctx = yield* $(Effect.context<R2 | R3 | Scope>())
      const context = Context.merge(f(ctx))(ctx)

      return yield* $(Effect.provideContext(context)(self.run(sink)))
    })
  }
}
