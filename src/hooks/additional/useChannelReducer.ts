import { deepEqualsEq } from '@typed/fp/common/exports'
import { Arity2 } from '@typed/fp/common/types'
import { doEffect } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { applyReducer, Channel, getChannelProvider, useMemo } from '../core/exports'

export const useChannelReducer = <E, A, B>(
  channel: Channel<E, A>,
  reducer: Arity2<A, B, A>,
  eq: Eq<A> = deepEqualsEq,
) => {
  const eff = doEffect(function* () {
    const [, state] = yield* getChannelProvider(channel, eq)

    return yield* useMemo(applyReducer, [reducer, state])
  })

  return eff
}
