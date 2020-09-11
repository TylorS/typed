import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect, map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { pipe } from 'fp-ts/es6/function'
import { Iso } from 'monocle-ts'

import { GetAndUpdateState, UseRefOp } from '../domain/exports'
import { useCallback } from './useCallback'
import { useMemo } from './useMemo'

export const useIso: {
  <A, B>(iso: Iso<A, B>, getAndUpdateState: GetAndUpdateState<A>): Effect<
    OpEnv<UseRefOp>,
    GetAndUpdateState<B>
  >
  <A, B>(iso: Iso<A, B>): (
    getAndUpdateState: GetAndUpdateState<A>,
  ) => Effect<OpEnv<UseRefOp>, GetAndUpdateState<B>>
} = curry(
  <A, B>(
    iso: Iso<A, B>,
    getAndUpdateState: GetAndUpdateState<A>,
  ): Effect<OpEnv<UseRefOp>, GetAndUpdateState<B>> =>
    doEffect(function* () {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const getState = yield* useMemo((_) => map(iso.get, getAndUpdateState[0]), [
        iso,
        getAndUpdateState[0],
      ])

      const updateState = yield* useCallback(
        (update: Arity1<B, B>) =>
          map(
            iso.get,
            getAndUpdateState[1]((a) => pipe(a, iso.get, update, iso.reverseGet)),
          ),
        [iso, getAndUpdateState[1]],
      )

      return [getState, updateState] as const
    }),
)
