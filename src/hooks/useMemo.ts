import { doEffect, Effect, Pure } from '@typed/fp/Effect'
import { Fn } from '@typed/fp/lambda'
import { OpEnv } from '@typed/fp/Op'
import { Eq, eqStrict } from 'fp-ts/es6/Eq'
import { getEq } from 'fp-ts/es6/ReadonlyArray'

import { useRef, UseRefOp } from './useRef'

const pureTrue = Pure.of(true)

export const useMemo = <A extends readonly any[], B>(
  f: Fn<A, B>,
  deps: A,
  eq: Eq<A> = getEq(eqStrict),
): Effect<OpEnv<UseRefOp>, B> =>
  doEffect(function* () {
    const firstRunRef = yield* useRef(pureTrue)
    const depsRef = yield* useRef(Pure.of(deps))
    const valueRef = yield* useRef(Pure.fromIO(() => f(...deps)))

    if (firstRunRef.value) {
      firstRunRef.value = false

      return valueRef.value
    }

    const changed = !eq.equals(depsRef.value, deps)

    if (changed) {
      depsRef.value = deps
      valueRef.value = f(...deps)
    }

    return valueRef.value
  })
