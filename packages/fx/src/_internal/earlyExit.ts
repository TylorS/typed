import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

export const EarlyExit = Symbol('EarlyExit')
export type EarlyExit = typeof EarlyExit

export const earlyExit = Effect.die(EarlyExit)

export const isEarlyExit = (e: unknown): e is EarlyExit => e === EarlyExit

export const catchEarlyExit =
  <R2, E2, B>(onEarlyExit: Effect.Effect<R2, E2, B>) =>
  <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R | R2, E | E2, A | B> =>
    pipe(
      effect,
      Effect.catchAllDefect((e) => (isEarlyExit(e) ? onEarlyExit : Effect.die(e))),
    )
