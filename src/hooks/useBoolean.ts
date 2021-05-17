import * as E from '@fp/Env'
import { DoF } from '@fp/Fiber'
import { Refs, WrappedRef } from '@fp/Ref'
import { Resume } from '@fp/Resume'
import { constFalse } from 'cjs/function'
import * as B from 'fp-ts/boolean'

import { useOp } from './useOp'
import { useRef } from './useRef'

const BooleanRef = useRef(E.fromIO(constFalse), B.Eq)

export const useBoolean = DoF(function* (_) {
  const Boolean = yield* _(BooleanRef)
  const toggleOrSet = yield* _(
    useOp((value?: boolean) =>
      value === undefined ? Boolean.modify((x) => !x) : Boolean.set(value),
    ),
  )
  const value = yield* _(Boolean.get)
  const use: readonly [
    value: boolean,
    toggleOrSet: (value?: boolean) => Resume<boolean>,
    ref: WrappedRef<Refs, unknown, boolean>,
  ] = [value, toggleOrSet, Boolean] as const

  return use
})
