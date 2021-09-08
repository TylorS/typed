import { matchW } from 'fp-ts/Either'
import { constant, flow, pipe } from 'fp-ts/function'

import { AtomicReference } from '@/AtomicReference'
import { Exit } from '@/Exit'
import { fromCause, fromIO } from '@/Fx'
import { Fx } from '@/Fx/Fx'

export interface Future<R, E, A> {
  readonly state: AtomicReference<FutureState<R, E, A>>
}

export function pending<R, E, A>(): Future<R, E, A> {
  return {
    state: new AtomicReference<FutureState<R, E, A>>({ _tag: 'Pending', listeners: new Set() }),
  }
}

export function fromExit<E, A>(exit: Exit<E, A>): Future<unknown, E, A> {
  return {
    state: new AtomicReference<FutureState<unknown, E, A>>({
      _tag: 'Done',
      fx: pipe(exit, matchW(fromCause, flow(constant, fromIO))),
    }),
  }
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
