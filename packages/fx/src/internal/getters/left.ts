import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Either, Effect, Scope, pipe } from '@typed/fx/internal/externals'

export function left<R, E, A, B>(
  self: Fx<R, E, Either.Either<A, B>>,
): Fx<R, Either.Either<E, B>, A> {
  return new LeftFx(self)
}

export default class LeftFx<R, E, A, B> extends BaseFx<R, Either.Either<E, B>, A> {
  readonly name = 'Left'

  constructor(readonly self: Fx<R, E, Either.Either<A, B>>) {
    super()
  }

  run(sink: Sink<Either.Either<E, B>, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (e) =>
          pipe(
            e,
            Either.match(
              (b) => sink.event(b),
              (a) => sink.error(Cause.fail(Either.right(a))),
            ),
          ),
        (cause) => sink.error(Cause.map(cause, Either.left)),
        sink.end,
      ),
    )
  }
}
