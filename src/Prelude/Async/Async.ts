import { Disposable, DisposableQueue, dispose } from '@/Disposable'
import { HKT, Params } from '@/Prelude/HKT'

import { Gen, getGenerator } from '../Generator'

export interface Async<A> extends Gen<AsyncCallback<any>, A> {}

export function Async<A>(f: () => Generator<AsyncCallback<any>, A>): Async<A> {
  return Gen(f)
}

export interface AsyncCallback<A> {
  (cb: (a: A) => void): Disposable
}

export interface AsyncHKT extends HKT {
  readonly type: Async<this[Params.A]>
}

export const fromCallback = <A>(run: (cb: (a: A) => void) => Disposable): Async<A> =>
  Async(function* () {
    return (yield run) as A
  })

export const runDisposable = <A>(async: Async<A>): Disposable => run(async)[0]
export const runPromise = <A>(async: Async<A>): Promise<A> => run(async)[1]

export const run = <A>(
  async: Async<A>,
): readonly [disposable: DisposableQueue, result: Promise<A>] => {
  const queue = new DisposableQueue()

  return [queue, runAsync(async, queue)]
}

async function runAsync<A>(async: Async<A>, queue: DisposableQueue): Promise<A> {
  const gen = getGenerator(async)
  let result = gen.next()

  while (!result.done) {
    const inner = new DisposableQueue()
    const cleanup = queue.add(inner)
    const f = result.value
    const value = await new Promise((r) => inner.add(f(r)))

    // Will always be synchronous
    dispose(cleanup)

    result = gen.next(value)
  }

  return result.value
}
