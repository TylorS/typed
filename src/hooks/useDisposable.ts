import { fromIO } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import { Disposable } from '@most/types'
import * as RA from 'fp-ts/ReadonlyArray'

import { useEq } from './useEq'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  deps: Deps = [] as any,
  eqs: { readonly [K in keyof Deps]: Eq.Eq<Deps[K]> } = RA.getEq(Eq.deepEqualsEq) as any,
) =>
  Do(function* (_) {
    const ref = yield* _(useRef(fromIO(f)))
    const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs)))

    if (!isEqual) {
      ref.current.dispose()
      ref.current = f()
    }

    return ref.current
  })
