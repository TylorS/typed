import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect, map } from '@typed/fp/Effect/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { constant, pipe } from 'fp-ts/es6/function'
import * as O from 'fp-ts/es6/Option'
import { Prism } from 'monocle-ts'

import { GetAndUpdateState, UseRefOp } from '../domain/exports'
import { useCallback } from './useCallback'
import { useMemo } from './useMemo'

export const usePrism = <A, B>(
  prism: Prism<A, B>,
  s: GetAndUpdateState<A>,
): Effect<OpEnv<UseRefOp>, GetAndUpdateState<O.Option<B>>> => {
  const eff = doEffect(function* () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getState = yield* useMemo((_) => map(prism.getOption, s[0]), [prism, s[0]])

    const updateState = yield* useCallback(
      (update: Arity1<O.Option<B>, O.Option<B>>) =>
        map(
          prism.getOption,
          s[1]((a) =>
            pipe(
              a,
              prism.getOption,
              update,
              O.fold(constant(a), (b) => prism.set(b)(a)),
            ),
          ),
        ),
      [prism, s[1]],
    )

    return [getState, updateState] as const
  })

  return eff
}
