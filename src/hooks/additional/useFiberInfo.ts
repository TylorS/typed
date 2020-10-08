import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect, execPure } from '@typed/fp/Effect/exports'
import { FiberInfo } from '@typed/fp/fibers/Fiber'
import { Fn } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { flow } from 'fp-ts/function'
import { getEq } from 'fp-ts/ReadonlyArray'

import { getState, setState, useDisposable, useState } from '../core/exports'
import { useFiber } from './useFiber'

export function useFiberInfo<A extends ReadonlyArray<any>, B, C, D>(
  f: Fn<A, Effect<B, C>>,
  args: A | Readonly<A>,
  onInfo: (info: FiberInfo<C>) => D,
  eq: Eq<A> | Eq<Readonly<A>> = getEq(deepEqualsEq),
) {
  const eff = doEffect(function* () {
    const fiber = yield* useFiber(f, args, eq)
    const state = yield* useState(Pure.fromIO(flow(fiber.getInfo, onInfo)))

    yield* useDisposable((f) => f.onInfoChange((info) => execPure(setState(onInfo(info), state))), [
      fiber,
    ])

    return yield* getState(state)
  })

  return eff
}
