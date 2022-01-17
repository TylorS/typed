import { matchW } from 'fp-ts/Either'
import { constant, flow, pipe } from 'fp-ts/function'

import { Exit } from '@/Exit'
import { fromCause, fromIO } from '@/Fx'
import { Fx } from '@/Fx/Fx'
import { MutableRef } from '@/MutableRef'

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
      fx: pipe(exit, matchW(fromCause, flow(constant, fromIO))),
    }),
  }
}

export type FutureState<R, E, A> = Pending<R, E, A> | Done<R, E, A>

export interface Pending<R, E, A> {
  readonly type: 'Pending'
  readonly listeners: Set<(fx: Fx<R, E, A>) => void>
}

export interface Done<R, E, A> {
  readonly type: 'Done'
  readonly fx: Fx<R, E, A>
}
