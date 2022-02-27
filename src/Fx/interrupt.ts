import { Fiber } from '@/Fiber'

import { dispose } from './dispose'
import { getContext } from './Effect'
import { Fx } from './Fx'

export function interrupt<E, A>(fiber: Fiber<E, A>) {
  return Fx(function* () {
    const { fiberId } = yield* getContext('interrupt')

    return yield* dispose(fiber.dispose(fiberId))
  })
}
