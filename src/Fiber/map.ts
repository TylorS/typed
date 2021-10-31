import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Fx } from '@/Fx'

import { Fiber } from './Fiber'
import { makeSyntheticFiber } from './makeFiber'

export function map<A, B>(f: (a: A) => B) {
  return (fiber: Fiber<A>): Fiber<B> => {
    return makeSyntheticFiber(
      Fx(function* () {
        return pipe(yield* fiber.exit, E.map(f))
      }),
      fiber.status,
      fiber.context,
      fiber,
    )
  }
}
