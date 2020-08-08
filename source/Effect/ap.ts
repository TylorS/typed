import { Arity1 } from '@typed/fp/common'
import { disposeNone, lazy } from '@typed/fp/Disposable'
import { curry } from '@typed/fp/lambda'
import { chain } from './chain'
import { Effect, EffectCb } from './Effect'
import { map } from './map'

const apSeqUncurried = <E1, A, B, E2>(
  fn: Effect<E1, Arity1<A, B>>,
  value: Effect<E2, A>,
): Effect<E1 & E2, B> => chain((f) => map(f, value), fn)

export const apSeq = curry(apSeqUncurried) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}

const apUncurried = <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>) => {
  return (e: E1 & E2) => (cb: EffectCb<B>) => {
    const values = Array(2)
    const hasValues = Array(2).fill(false)
    const disposable = lazy()

    function onValue(value: A | Arity1<A, B>, index: 0 | 1) {
      values[index] = value
      hasValues[index] = true

      if (disposable.disposed || !hasValues.every(Boolean)) {
        return disposeNone()
      }

      return disposable.addDisposable(cb(values[0](values[1])))
    }

    disposable.addDisposable(fn(e)((ab) => onValue(ab, 0)))
    disposable.addDisposable(value(e)((a) => onValue(a, 1)))

    return disposable
  }
}

export const ap = curry(apUncurried) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}
