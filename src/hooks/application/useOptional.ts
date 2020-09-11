import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, Effect, map, Pure } from '@typed/fp/Effect/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { constant, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Optional } from 'monocle-ts'

import { GetAndUpdateState, UseRefOp } from '../domain/exports'
import { useCallback } from './useCallback'
import { useMemo } from './useMemo'

export const useOptional = <A, B>(
  optional: Optional<A, B>,
  s: GetAndUpdateState<A>,
): Effect<OpEnv<UseRefOp>, GetAndUpdateState<O.Option<B>>> =>
  doEffect(function* () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getState: Pure<O.Option<B>> = yield* useMemo((_) => map(optional.getOption, s[0]), [
      optional,
      s[0],
    ])

    const updateState: (
      update: Arity1<O.Option<B>, O.Option<B>>,
    ) => Pure<O.Option<B>> = yield* useCallback(
      (update: Arity1<O.Option<B>, O.Option<B>>) =>
        map(
          optional.getOption,
          s[1]((a) => {
            const updated = update(optional.getOption(a))

            return pipe(
              updated,
              O.fold(constant(a), (b) => optional.set(b)(a)),
            )
          }),
        ),
      [optional, s[1]],
    )

    return [getState, updateState] as const
  })
