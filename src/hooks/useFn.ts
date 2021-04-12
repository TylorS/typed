import * as E from '@fp/Env'
import { FunctionN } from '@fp/function'

import { DepsArgs, getDeps } from './Deps'
import { useMemo } from './useMemo'

export const useFn = <
  F extends FunctionN<readonly any[], any>,
  Deps extends ReadonlyArray<any> = []
>(
  f: F,
  ...args: DepsArgs<Deps>
) => useMemo(E.of(f), ...getDeps(args))
