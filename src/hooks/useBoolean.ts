import * as E from '@fp/Env'
import { DoF } from '@fp/Fiber'
import { WrappedRef } from '@fp/Ref'
import { Resume } from '@fp/Resume'
import * as B from 'fp-ts/boolean'

import { useOp } from './useOp'
import { useRef } from './useRef'

const useBooleanRef = (initial: boolean) => useRef(E.of(initial), B.Eq)

export const useBoolean = (initial = false) =>
  DoF(function* (_) {
    const Boolean = yield* _(useBooleanRef(initial))
    const toggleOrSet = yield* _(
      useOp((value?: boolean) =>
        value === undefined ? Boolean.modify((x) => !x) : Boolean.set(value),
      ),
    )
    const value = yield* _(Boolean.get)
    const use: readonly [
      value: boolean,
      toggleOrSet: (value?: boolean) => Resume<boolean>,
      ref: WrappedRef<unknown, unknown, boolean>,
    ] = [value, toggleOrSet, Boolean] as const

    return use
  })
