import { ask, doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Uuid } from '@typed/fp/Uuid/exports'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { createRef, Ref } from '../domain/exports'
import { getNextIndex, lookupByIndex } from './helpers'
import { HookEnv, HookEnvironment } from './HookEnvironment'

const pureUndefined = Pure.of(undefined)

export function createUseRefByIndex(
  hookPositions: Map<Uuid, number>,
  getReference: (index: number) => symbol,
) {
  const useRefByIndex = <E, A>(
    initialValue: Effect<E, A> = pureUndefined as any,
  ): Effect<HookEnv & E, Ref<A>> =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()
      const index = getNextIndex(hookPositions, hookEnvironment.id)
      const reference = getReference(index)
      const state = pipe(hookEnvironment.states, lookupByIndex(reference))

      if (isNone(state)) {
        return yield* setRefByIndex(hookEnvironment, reference, initialValue)
      }

      return state.value as Ref<A>
    })

  return useRefByIndex
}

function setRefByIndex<E, A>(
  hookEnvironment: HookEnvironment,
  reference: symbol,
  initialValue: Effect<E, A>,
): Effect<E, Ref<A>> {
  return doEffect(function* () {
    const ref = createRef(yield* initialValue)

    hookEnvironment.states.set(reference, ref)

    return ref
  })
}
