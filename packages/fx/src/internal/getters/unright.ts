import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Cause, Either, Effect, pipe, Scope } from '@typed/fx/internal/externals'

export function unright<R, E, A, B>(
  fx: Fx<R, Either.Either<A, E>, B>,
): Fx<R, E, Either.Either<A, B>> {
  return new UnrightFx(fx)
}

export class UnrightFx<R, E, A, B> extends BaseFx<R, E, Either.Either<A, B>> {
  readonly name = 'Unright'

  constructor(readonly self: Fx<R, Either.Either<A, E>, B>) {
    super()
  }

  run(sink: Sink<E, Either.Either<A, B>>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (b) => sink.event(Either.right(b)),
        (cause) =>
          pipe(
            Cause.failureOrCause(cause),
            Either.match(
              Either.match(
                (a) => sink.event(Either.left(a)),
                (e) => sink.error(Cause.fail(e)),
              ),
              sink.error,
            ),
          ),
        sink.end,
      ),
    )
  }
}
