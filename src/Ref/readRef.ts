import { doEffect, Effect } from '@typed/fp/Effect'

import { Ref, RefEnv, RefValue } from './Ref'
import { retrieveRef } from './retrieveRef'

export const readRef = <R extends Ref<any, any>>(ref: R): Effect<RefEnv<R>, RefValue<R>> =>
  doEffect(function* () {
    const ioRef = yield* retrieveRef<R>(ref)

    return ioRef.read()
  })
