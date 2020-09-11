import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect, map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { pipe } from 'fp-ts/es6/function'
import { Lens } from 'monocle-ts'

import { GetAndUpdateState, UseRefOp } from '../domain/exports'
import { useCallback } from './useCallback'
import { useMemo } from './useMemo'

export const useLens: {
  <A, B>(lens: Lens<A, B>, getAndUpdateState: GetAndUpdateState<A>): Effect<
    OpEnv<UseRefOp>,
    GetAndUpdateState<B>
  >
  <A, B>(lens: Lens<A, B>): (
    getAndUpdateState: GetAndUpdateState<A>,
  ) => Effect<OpEnv<UseRefOp>, GetAndUpdateState<B>>
} = curry(
  <A, B>(
    lens: Lens<A, B>,
    getAndUpdateState: GetAndUpdateState<A>,
  ): Effect<OpEnv<UseRefOp>, GetAndUpdateState<B>> =>
    doEffect(function* () {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const getState = yield* useMemo((_) => map(lens.get, getAndUpdateState[0]), [
        lens,
        getAndUpdateState[0],
      ])

      const updateState = yield* useCallback(
        (update: Arity1<B, B>) =>
          map(
            lens.get,
            getAndUpdateState[1]((a) => pipe(a, lens.get, update, (b) => lens.set(b)(a))),
          ),
        [lens, getAndUpdateState[1]],
      )

      return [getState, updateState] as const
    }),
)
