import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Effect, Scope, Option, pipe } from '@typed/fx/internal/_externals'

export function some<R, E, A>(self: Fx<R, E, Option.Option<A>>): Fx<R, Option.Option<E>, A> {
  return new SomeFx(self)
}

export class SomeFx<R, E, A> extends BaseFx<R, Option.Option<E>, A> {
  readonly name = 'Some'

  constructor(readonly self: Fx<R, E, Option.Option<A>>) {
    super()
  }

  run(sink: Sink<Option.Option<E>, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        (o) =>
          pipe(
            o,
            Option.match(
              () => sink.error(Cause.fail(Option.none())),
              (a) => sink.event(a),
            ),
          ),
        (cause) => sink.error(Cause.map(cause, Option.some)),
        () => sink.end(),
      ),
    )
  }
}
