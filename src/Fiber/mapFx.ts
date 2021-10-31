import * as E from 'fp-ts/Either'

import { Fx, Of } from '@/Fx'

import { Fiber } from './Fiber'
import { makeSyntheticFiber } from './makeFiber'

export function mapFx<A, B>(f: (a: A) => Of<B>) {
  return (fiber: Fiber<A>): Fiber<B> => {
    return makeSyntheticFiber(
      Fx(function* () {
        const exit = yield* fiber.exit

        if (E.isLeft(exit)) {
          return exit
        }

        return E.right(yield* f(exit.right))
      }),
      fiber.status,
      fiber.context,
      fiber,
    )
  }
}
