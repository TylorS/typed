import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, Either } from '@typed/fx/internal/_externals'
import type { Context } from '@typed/fx/internal/_externals'

export const tapEither: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E, E3>(
    self: Fx<R, E, Either.Either<E3, A>>,
  ) => Fx<R | R2, E | E3, Either.Either<E3, A>>

  <R, E, E2, A, R2, E3, B>(
    self: Fx<R, E, Either.Either<E2, A>>,
    f: (a: A) => Effect.Effect<R2, E3, B>,
  ): Fx<R | R2, E | E3, Either.Either<E2, A>>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, E2, A, R2, E3, B>(
      self: Fx<R, E, Either.Either<E2, A>>,
      f: (a: A) => Effect.Effect<R2, E3, B>,
    ) =>
      new TapEitherFx(self, f).traced(trace),
)

export const tapEitherSync: {
  <A, B>(f: (a: A) => B): <R, E, E2>(
    self: Fx<R, E, Either.Either<E2, A>>,
  ) => Fx<R, E, Either.Either<E2, A>>
  <R, E, E2, A, B>(self: Fx<R, E, Either.Either<E2, A>>, f: (a: A) => B): Fx<
    R,
    E,
    Either.Either<E2, A>
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, E2, A, B>(self: Fx<R, E, Either.Either<E2, A>>, f: (a: A) => B) =>
      new TapEitherFx(self, (a) => Effect.sync(() => f(a))).traced(trace),
)

class TapEitherFx<R, E, E2, A, R2, E3, B> extends BaseFx<R | R2, E | E3, Either.Either<E2, A>> {
  readonly name = 'TapEither' as const

  constructor(
    readonly self: Fx<R, E, Either.Either<E2, A>>,
    readonly f: (a: A) => Effect.Effect<R2, E3, B>,
  ) {
    super()
  }

  run(sink: Sink<E | E3, Either.Either<E2, A>>) {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2>) =>
      this.self.run(
        Sink(
          (either) => {
            if (Either.isRight(either)) {
              return Effect.provideContext(
                Effect.matchCauseEffect(this.f(either.right), sink.error, () => sink.event(either)),
                ctx,
              )
            } else {
              return sink.event(either)
            }
          },
          sink.error,
          sink.end,
        ),
      ),
    )
  }
}
