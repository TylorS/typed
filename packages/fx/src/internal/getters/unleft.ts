import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Either, Effect, pipe, Scope } from '@typed/fx/internal/externals'

export function unleft<R, E, A, B>(
  self: Fx<R, Either.Either<E, B>, A>,
): Fx<R, E, Either.Either<A, B>> {
  return new UnleftFx(self)
}

export class UnleftFx<R, E, A, B> extends BaseFx<R, E, Either.Either<A, B>> {
  readonly name = 'Unleft'

  constructor(readonly self: Fx<R, Either.Either<E, B>, A>) {
    super()
  }

  run(sink: Sink<E, Either.Either<A, B>>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (a) => sink.event(Either.left(a)),
        (cause) =>
          pipe(
            Cause.failureOrCause(cause),
            Either.match(
              Either.match(
                (e) => sink.error(Cause.fail(e)),
                (b) => sink.event(Either.right(b)),
              ),
              sink.error,
            ),
          ),
        sink.end,
      ),
    )
  }
}
