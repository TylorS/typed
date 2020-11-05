import { doEffect } from '@typed/fp/Effect/exports'
import { fromKey, getSharedState, getState, updateState } from '@typed/fp/Shared/exports'
import { decrement, increment } from 'fp-ts/function'

const Count = fromKey<number>()('count')

export const useCounter = doEffect(function* () {
  const count = yield* getSharedState(Count)

  return {
    count: getState(count),
    increment: () => updateState(increment, count),
    decrement: () => updateState(decrement, count),
  }
})
