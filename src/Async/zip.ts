import { Settable } from '@/Cancelable/settable'

import { Async } from './Async'

export function zip<A extends readonly any[]>(
  ...asyncs: { [K in keyof A]: Async<A[K]> }
): Async<A> {
  return (k) => {
    const settable = new Settable()
    const values = Array(asyncs.length)
    let remaining = asyncs.length

    const finish = (x: any, i: number): void => {
      values[i] = x
      remaining--

      if (remaining === 0) {
        k(values as any)
      }
    }

    asyncs.map((f, i) => f((a) => finish(a, i)))

    return settable
  }
}
