import { AtomicReference } from '@/AtomicReference'
import { Fx } from '@/Fx/Fx'

export interface Future<R, E, A> {
  readonly state: AtomicReference<FutureState<R, E, A>>
}

export type FutureState<R, E, A> = Pending<R, E, A> | Done<R, E, A>

export interface Pending<R, E, A> {
  readonly _tag: 'Pending'
  readonly listeners: Set<(fx: Fx<R, E, A>) => void>
}

export interface Done<R, E, A> {
  readonly _tag: 'Done'
  readonly fx: Fx<R, E, A>
}

export function make<R, E, A>(): Future<R, E, A> {
  return {
    state: new AtomicReference<FutureState<R, E, A>>({ _tag: 'Pending', listeners: new Set() }),
  }
}
