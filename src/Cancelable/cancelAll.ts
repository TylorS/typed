import { constVoid } from 'fp-ts/function'

import { Cancelable } from './Cancelable'

export function cancelAll(...cancelables: readonly Cancelable[]): Cancelable {
  return {
    cancel: () => {
      const xs = cancelables.map((c) => c.cancel())
      const hasPromise = xs.some(isPromiseLike)

      if (hasPromise) {
        return Promise.all(xs).then(constVoid)
      }
    },
  }
}

function isPromiseLike(x: unknown): x is PromiseLike<unknown> {
  return typeof x === 'object' && typeof (x as PromiseLike<unknown>)?.then === 'function'
}
