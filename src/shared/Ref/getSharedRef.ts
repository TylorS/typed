import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import {
  EnvOf,
  getOrCreate,
  getShared,
  Shared,
  SharedEnv,
  ValueOf,
} from '@typed/fp/shared/core/exports'

import { getSharedState, getState, setState, State } from '../State/exports'
import { NamespaceRefs } from './NamespaceRefs'
import { Ref } from './Ref'

/**
 * Get a shared value as a Reference
 */
export const getSharedRef = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & EnvOf<S>, Ref<ValueOf<S>>> =>
  doEffect(function* () {
    const state = yield* getSharedState(shared)
    const refs = yield* getShared(NamespaceRefs)

    return yield* getOrCreate(
      refs,
      shared.key,
      Pure.fromIO(() => stateToRef(state)),
    )
  })

function stateToRef<A>(state: State<A>): Ref<A> {
  return {
    get current() {
      return getState(state)
    },
    set current(value) {
      setState(value, state)
    },
  }
}
