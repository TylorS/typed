import { Disposable } from '@/Disposable'

export type Async<A> = (cb: (a: A) => void) => Disposable
