import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect, lazy } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { HookEnv } from './HookEnvironment'
import { HookPositions } from './HookPositions'
import { HookSymbols } from './HookSymbols'
import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

export const useMemoEffect = <Args extends ReadonlyArray<any>, E, A>(
  fn: Fn<Args, Effect<E, A>>,
  args: Args | Readonly<Args>,
  eq: Eq<Args> = getEq(deepEqualsEq),
): Effect<HookEnv & SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols> & E, A> => {
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
