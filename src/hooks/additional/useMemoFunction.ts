import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { identity, pipe } from 'fp-ts/function'
import { deleteAt, insertAt, lookup } from 'fp-ts/Map'
import { fold } from 'fp-ts/Option'

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
    const add = yield* useMemo(insertAt, [eq])
    const get = yield* useMemo(lookup, [eq])

    const remove = yield* useMemo(
      (e) => (...args: Args) => {
        deleteAt(e)(args)(map.current)
      },
      [eq],
    )

    const f = yield* useMemo(
      (add, get) => (...args: Args) =>
        pipe(
          get(args)(map.current),
          fold(() => {
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
