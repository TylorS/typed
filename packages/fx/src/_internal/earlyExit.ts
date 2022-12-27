// import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
// import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
// import * as Chunk from '@fp-ts/data/Chunk'
import { pipe } from '@fp-ts/data/Function'

// import { asap } from './RefCounter.js'

// // Need to replace with real cancelation of a Fiber somehow

// const EarlyExit = Symbol('EarlyExit')
// type EarlyExit = typeof EarlyExit

// const earlyExit = Effect.die(EarlyExit)

// const isEarlyExit = (e: unknown): e is EarlyExit => e === EarlyExit

// const catchEarlyExit =
//   <R2, E2, B>(onEarlyExit: Effect.Effect<R2, E2, B>) =>
//   <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R | R2, E | E2, A | B> =>
//     pipe(
//       effect,
//       Effect.catchAllCause(
//         (e): Effect.Effect<R2, E | E2, B> =>
//           Chunk.some(isEarlyExit)(Cause.defects(e)) ? onEarlyExit : Effect.failCause(e),
//       ),
//     )

export function withEarlyExit<R, E, A, R2, E2, B>(
  f: (_: Effect.Effect<never, never, never>) => Effect.Effect<R, E, A>,
  onEnd: Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2 | Scope.Scope, E | E2, void> {
  return Effect.asyncEffect((cb) =>
    pipe(
      Effect.sync(() => cb(onEnd)),
      Effect.flatMap(Effect.never),
      f,
      Effect.onExit((exit) => Effect.sync(() => cb(Effect.done(exit)))),
    ),
  )
}
