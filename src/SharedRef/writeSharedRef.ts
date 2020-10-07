import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { retrieveSharedRef } from './retrieveSharedRef'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const writeSharedRef = curry(
  <R extends SharedRef<any, any>>(
    shared: R,
    value: SharedRefValue<R>,
  ): Effect<SharedRefEnv<R>, SharedRefValue<R>> =>
    doEffect(function* () {
      const ref = yield* retrieveSharedRef<R>(shared)

      ref.current = value

      return value
    }),
) as {
  <R extends SharedRef<any, any>>(ref: R, value: SharedRefValue<R>): Effect<
    SharedRefEnv<R>,
    SharedRefValue<R>
  >

  <R extends SharedRef<any, any>>(ref: R): (
    value: SharedRefValue<R>,
  ) => Effect<SharedRefEnv<R>, SharedRefValue<R>>
}
