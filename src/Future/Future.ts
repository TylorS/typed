import { Exit } from '@/Exit'
import * as Fx from '@/Fx'
import { MutableRef } from '@/Prelude/MutableRef'

export interface Future<R, E, A> {
  readonly state: MutableRef<FutureState<R, E, A>>
}

export function pending<R, E, A>(): Future<R, E, A> {
  return {
    state: new MutableRef<FutureState<R, E, A>>({ type: 'Pending', listeners: new Set() }),
  }
}

export function fromExit<E, A>(exit: Exit<E, A>): Future<unknown, E, A> {
  return {
    state: new MutableRef<FutureState<unknown, E, A>>({
      type: 'Done',
      fx: Fx.fromExit(exit),
    }),
  }
}

export type FutureState<R, E, A> = Pending<R, E, A> | Done<R, E, A>

export interface Pending<R, E, A> {
  readonly type: 'Pending'
  readonly listeners: Set<(fx: Fx.Fx<R, E, A>) => void>
}

export interface Done<R, E, A> {
  readonly type: 'Done'
  readonly fx: Fx.Fx<R, E, A>
}
