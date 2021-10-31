import { constant, flow } from 'fp-ts/function'

import { Fx } from './Fx'

export function map<A, B>(f: (a: A) => B) {
  return <R>(fx: Fx<R, A>): Fx<R, B> =>
    Fx(function* () {
      return f(yield* fx)
    })
}

export const mapTo = flow(constant, map)
