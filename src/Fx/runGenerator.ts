import { Fx } from './Fx'

export function runGenerator<Y, A, R, B>(onYield: (value: Y) => A, onReturn: (r: R) => B) {
  return <N = unknown>(fx: Fx<Y, R, N>): Fx<A, B, N> => {
    return {
      *[Symbol.iterator]() {
        const iterator = fx[Symbol.iterator]()
        let result = iterator.next()

        while (!result.done) {
          result = iterator.next(yield onYield(result.value))
        }

        return onReturn(result.value)
      },
    }
  }
}
