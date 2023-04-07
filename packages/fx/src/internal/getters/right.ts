import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Either, pipe, Effect, Scope } from '@typed/fx/internal/externals'

export function right<R, E, A, B>(
  self: Fx<R, E, Either.Either<A, B>>,
): Fx<R, Either.Either<A, E>, B> {
  return new RightFx(self)
}

export class RightFx<R, E, A, B> extends BaseFx<R, Either.Either<A, E>, B> {
  readonly name = 'Right'

  constructor(readonly self: Fx<R, E, Either.Either<A, B>>) {
    super()
  }

  run(sink: Sink<Either.Either<A, E>, B>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (e) =>
          pipe(
            e,
            Either.match(
              (a) => sink.error(Cause.fail(Either.left(a))),
              (b) => sink.event(b),
            ),
          ),
        (cause) => sink.error(Cause.map(cause, Either.right)),
        () => sink.end(),
      ),
    )
  }
}
