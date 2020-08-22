import { doEffect, Effect } from '@typed/fp/Effect'

import { Ref, RefEnv, RefValue } from './Ref'
import { retrieveRef } from './retrieveRef'

export const writeRef = <R extends Ref<any, any>>(ref: R) => (
  value: RefValue<R>,
): Effect<RefEnv<R>, RefValue<R>> =>
  doEffect(function* () {
    const ioRef = yield* retrieveRef<R>(ref)

    ioRef.write(value)()

    return value
  })
