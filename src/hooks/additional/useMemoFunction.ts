import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { identity, pipe } from 'fp-ts/function'
import * as M from 'fp-ts/Map'
import * as O from 'fp-ts/Option'

import { HookEnv, HookPositions, HookSymbols } from '../core/exports'
import { useMemo, useRef } from '../core/exports'

export const useMemoFunction = <Args extends ReadonlyArray<any>, R>(
  fn: Fn<Args, R>,
  eq: Eq<Args>,
): Effect<
  HookEnv & SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols>,
  readonly [Fn<Args, R>, Fn<Args, void>]
> => {
  const eff = doEffect(function* () {
    const map = yield* useRef(Pure.fromIO(() => new Map<Args, R>()))
    const add = yield* useMemo(M.insertAt, [eq])
    const get = yield* useMemo(M.lookup, [eq])

    const remove = yield* useMemo(
      (e) => (...args: Args) => {
        M.deleteAt(e)(args)(map.current)
      },
      [eq],
    )

    const f = yield* useMemo(
      (add, get) => (...args: Args) =>
        pipe(
          get(args)(map.current),
          O.fold(() => {
            const r = fn(...args)

            pipe(map.current, add(args, r))

            return r
          }, identity),
        ),
      [add, get] as const,
    )

    return [f, remove] as const
  })

  return eff
}
