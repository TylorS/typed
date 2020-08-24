import { Arity1 } from '@typed/fp/common'
import { doEffect, Effect, Pure } from '@typed/fp/Effect'
import { Eq } from 'fp-ts/es6/Eq'

import { HookEvent } from './events'

export type CreateUseStateOptions<K, E, A> = {
  readonly states: Map<K, any>
  readonly key: K
  readonly initialValue: Effect<E, A>
  readonly eq: Eq<A>
  readonly sendEvent: (event: HookEvent) => void
  readonly createEvent: <A>(value: A) => HookEvent
}

export function createUseState<K, E, A>(options: CreateUseStateOptions<K, E, A>) {
  const { states, key, initialValue, eq, sendEvent, createEvent } = options

  return doEffect(function* () {
    let state = yield* initialValue

    const getState = Pure.fromIO(() => state)
    const updateState = (update: Arity1<A, A>) =>
      Pure.fromIO(() => {
        const updated = update(state)

        if (eq.equals(state, updated)) {
          return state
        }

        state = updated

        sendEvent(createEvent(state))

        return state
      })

    states.set(key, [getState, updateState])

    return states.get(key)!
  })
}
