import { Disposable } from '@/Disposable'
import { Fx } from '@/Fx'
import { MutableRef } from '@/MutableRef'

export interface Future<R, E, A> {
  readonly state: MutableRef<FutureState<R, E, A>>
}

export type FutureState<R, E, A> = Pending<R, E, A> | Completed<R, E, A>

export interface Pending<R, E, A> {
  readonly type: 'Pending'
  readonly addObserver: (f: (fx: Fx<R, E, A>) => void) => Disposable
}

export interface Completed<R, E, A> {
  readonly type: 'Completed'
  readonly fx: Fx<R, E, A>
}
