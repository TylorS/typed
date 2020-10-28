import { Arity1 } from '@typed/fp/common/types'
import { ask, asks } from '@typed/fp/Effect/ask'
import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect, provideAll } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/lib/function'

export const SHARED = '@typed/fp/Shared' as const
export type SHARED = typeof SHARED

// Tag a key with additional infromation
export type Shared<K extends string = string, A = unknown> = K & { [SHARED]: A }

export type KeyOf<A> = [A] extends [Shared<infer K, any>] ? K : never
export type ValueOf<A> = [A] extends [Shared<any, infer R>] ? R : never

export interface SharedEnv<S extends Shared> {
  readonly [SHARED]: Record<S, ValueOf<S>>
}

export const shared = <S extends Shared>(key: KeyOf<S>): S => key as S

export const readShared = <S extends Shared>(s: S): Effect<SharedEnv<S>, ValueOf<S>> =>
  asks((e: SharedEnv<S>) => e[SHARED][s])

export const writeShared = curry(
  <S extends Shared>(s: S, value: ValueOf<S>): Effect<SharedEnv<S>, ValueOf<S>> =>
    asks((e: SharedEnv<S>) => (e[SHARED][s] = value)),
) as {
  <S extends Shared>(s: S, value: ValueOf<S>): Effect<SharedEnv<S>, ValueOf<S>>
  <S extends Shared>(s: S): (value: ValueOf<S>) => Effect<SharedEnv<S>, ValueOf<S>>
}

export const updateShared = curry(
  <S extends Shared>(
    s: S,
    update: Arity1<ValueOf<S>, ValueOf<S>>,
  ): Effect<SharedEnv<S>, ValueOf<S>> =>
    doEffect(function* () {
      const state = yield* readShared(s)

      return yield* writeShared(s, update(state))
    }),
) as {
  <S extends Shared>(s: S, update: Arity1<ValueOf<S>, ValueOf<S>>): Effect<SharedEnv<S>, ValueOf<S>>
  <S extends Shared>(s: S): (
    update: Arity1<ValueOf<S>, ValueOf<S>>,
  ) => Effect<SharedEnv<S>, ValueOf<S>>
}

export const provideShared = curry(
  <S extends Shared, E, A>(
    s: S,
    value: ValueOf<S>,
    effect: Effect<E & SharedEnv<S>, A>,
  ): Effect<E, A> => {
    const eff = doEffect(function* () {
      const env = yield* ask<E>()
      const provided = {
        [SHARED]: { ...((env as any)[SHARED] ?? {}), [s]: value },
      } as SharedEnv<S>

      return yield* pipe(effect, provideAll({ ...env, ...provided }))
    })

    return eff
  },
) as {
  <S extends Shared, E, A>(s: S, state: ValueOf<S>, effect: Effect<E & SharedEnv<S>, A>): Effect<
    E,
    A
  >

  <S extends Shared>(s: S, state: ValueOf<S>): <E, A>(
    effect: Effect<E & SharedEnv<S>, A>,
  ) => Effect<E, A>

  <S extends Shared>(s: S): {
    <E, A>(state: ValueOf<S>, effect: Effect<E & SharedEnv<S>, A>): Effect<E, A>
    (state: ValueOf<S>): <E, A>(effect: Effect<E & SharedEnv<S>, A>) => Effect<E, A>
  }
}
