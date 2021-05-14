import * as E from '@fp/Env'
import { CurrentFiber } from '@fp/Fiber'
import { FunctionN } from '@fp/function'

import { DepsArgs } from './Deps'
import { useMemo } from './useMemo'

export const useFn = <
  F extends FunctionN<readonly any[], any>,
  Deps extends ReadonlyArray<any> = []
>(
  f: F,
  ...args: DepsArgs<Deps>
): E.Env<CurrentFiber, F> => useMemo(E.of(f), ...args)
