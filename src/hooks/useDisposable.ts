import { fromIO } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import { Disposable } from '@most/types'

import { DepsArgs, getDeps } from './Deps'
import { useEq } from './useEq'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  ...args: DepsArgs<Deps>
) =>
  Do(function* (_) {
    const [deps, eqs] = getDeps(args)
    const ref = yield* _(useRef(fromIO(f)))
    const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs)))

    if (!isEqual) {
      ref.current.dispose()
      ref.current = f()
    }

    return ref.current
  })
