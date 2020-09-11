import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, lazy } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/es6/Eq'
import { getEq } from 'fp-ts/es6/ReadonlyArray'

import { useRef } from '../domain/exports'
import { useDepChange } from './useDepChange'

export const useMemoEffect = <Args extends ReadonlyArray<any>, E, A>(
  fn: Fn<Args, Effect<E, A>>,
  args: Args,
  eq: Eq<Args> = getEq(deepEqualsEq),
) => {
  const eff = doEffect(function* () {
    const depsChanged = yield* useDepChange(args, eq, false)
    const valueRef = yield* useRef(lazy(() => fn(...args)))

    if (!depsChanged) {
      return valueRef.current
    }

    valueRef.current = yield* fn(...args)

    return valueRef.current
  })

  return eff
}
