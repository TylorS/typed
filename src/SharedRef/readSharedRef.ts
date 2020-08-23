import { doEffect, Effect } from '@typed/fp/Effect'

import { retrieveSharedRef } from './retrieveSharedRef'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const readSharedRef = <R extends SharedRef<any, any>>(
  ref: R,
): Effect<SharedRefEnv<R>, SharedRefValue<R>> =>
  doEffect(function* () {
    const ioRef = yield* retrieveSharedRef<R>(ref)

    return ioRef.read()
  })
