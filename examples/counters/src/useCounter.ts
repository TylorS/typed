import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { createShared, getSharedState, getState, updateState } from '@typed/fp/Shared/exports'
import { decrement, increment } from 'fp-ts/function'

export const Count = createShared('count', Pure.of(0))

export const useCounter = doEffect(function* () {
  const state = yield* getSharedState(Count)

  return {
    count: getState(state),
    increment: () => updateState(increment, state),
    decrement: () => updateState((x) => Math.max(0, decrement(x)), state),
  } as const
})
