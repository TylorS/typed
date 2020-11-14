import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  getShared,
  GetSharedEnv,
  GetSharedValue,
  Shared,
  SharedEnv,
} from '@typed/fp/Shared/core/exports'

import { NamespaceRefs } from './NamespaceRefs'
import { createRef, Ref } from './Ref'

/**
 * Get a shared value as a Reference
 */
export const getSharedRef = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, Ref<GetSharedValue<S>>> =>
  doEffect(function* () {
    const refs = yield* getShared(NamespaceRefs)

    if (refs.has(shared.key)) {
      return refs.get(shared.key)!
    }

    const ref = createRef(yield* shared.initial)

    refs.set(shared.key, ref)

    return ref
  })
