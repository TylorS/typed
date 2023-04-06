import { Effect } from './_externals.js'

export function withEarlyExit<R, E, A>(
  f: (earlyExit: Effect.Effect<never, never, never>) => Effect.Effect<R, E, A>,
): Effect.Effect<R, E, void> {
  return Effect.asyncEffect((cb) =>
    Effect.gen(function* ($) {
      const earlyExit = Effect.flatMap(
        Effect.sync(() => cb(Effect.unit())),
        Effect.never,
      )
      const result = yield* $(f(earlyExit))

      cb(Effect.succeed(result))
    }),
  )
}
