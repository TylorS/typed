import * as E from '@fp/Env'
import * as Eq from '@fp/Eq'
import { FunctionN } from '@fp/function'
import * as RA from 'fp-ts/ReadonlyArray'

import { useMemo } from './useMemo'

export const useFn = <
  F extends FunctionN<readonly any[], any>,
  Deps extends ReadonlyArray<any> = []
>(
  f: F,
  deps: Deps = [] as any,
  eqs: { readonly [K in keyof Deps]: Eq.Eq<Deps[K]> } = RA.getEq(Eq.deepEqualsEq) as any,
) =>
  useMemo(
    E.fromIO(() => f),
    deps,
    eqs,
  )
