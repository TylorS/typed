import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { retrieveSharedRef } from './retrieveSharedRef'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const readSharedRef = <R extends SharedRef<any, any>>(
  shared: R,
): Effect<SharedRefEnv<R>, SharedRefValue<R>> =>
  doEffect(function* () {
    const ref = yield* retrieveSharedRef<R>(shared)

    return ref.current
  })
