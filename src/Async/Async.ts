import { Disposable } from '@/Disposable'

export interface Async<A> {
  readonly type: 'Async'
  readonly run: (cb: (a: A) => void) => Disposable
}

export const Async = <A>(run: (cb: (a: A) => void) => Disposable): Async<A> => ({
  type: 'Async',
  run,
})
