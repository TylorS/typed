import { dual } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Context } from '@typed/fx/internal/externals'

export const continueWith: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>

  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
} = dual(
  2,
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B> =>
    new ContinueWithFx(fx, f),
)

export class ContinueWithFx<R, E, A, R2, E2, B> extends BaseFx<R | R2, E | E2, A | B> {
  readonly name = 'ContinueWith'

  constructor(readonly fx: Fx<R, E, A>, readonly f: () => Fx<R2, E2, B>) {
    super()
  }

  run(sink: Sink<E | E2, A | B>): Effect.Effect<R | R2 | Scope, never, void> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope>) =>
      this.fx.run(
        Sink(sink.event, sink.error, () =>
          Effect.suspend(() => Effect.provideContext(this.f().run(sink), ctx)),
        ),
      ),
    )
  }
}
