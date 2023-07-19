import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

export function catchNoSuchElement<R, E, A>(
  effect: Effect.Effect<R, E | Cause.NoSuchElementException, A>,
): Effect.Effect<R, Exclude<E, Cause.NoSuchElementException>, Option.Option<A>> {
  return effect.pipe(
    Effect.map(Option.some),
    Effect.catchAll((e) =>
      Cause.isNoSuchElementException(e)
        ? Effect.succeedNone
        : Effect.fail(e as Exclude<E, Cause.NoSuchElementException>),
    ),
  )
}
