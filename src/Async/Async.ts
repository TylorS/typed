import { Disposable } from '@/Disposable'

export interface Async<A> {
  (cb: (a: A) => void): Disposable
}
