import { Either } from 'fp-ts/Either'

import { Fx } from '@/Fx'
import { MutableRef } from '@/MutableRef'

export interface Future<R, E, A> {
  readonly state: MutableRef<FutureState<R, E, A>>
}

export type FutureState<R, E, A> = Pending<R, E, A> | Completed<R, E, A>

export interface Pending<R, E, A> {
  readonly type: 'Pending'
  readonly observers: MutableRef<ReadonlyArray<(fx: Fx<R, Either<E, A>>) => void>>
}

export interface Completed<R, E, A> {
  readonly type: 'Completed'
  readonly fx: Fx<R, Either<E, A>>
}
