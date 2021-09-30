import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Uncancelable } from '@/Cancelable'
import { Cause } from '@/Cause'
import { Exit } from '@/Exit'
import { getScope } from '@/Fiber'
import * as Fx from '@/Fx'

export interface Future<A> {
  readonly getState: () => FutureState<A>
  readonly setState: (state: FutureState<A>) => boolean // Whether or not you were able to update the state
}

export type FutureState<A> = Pending<A> | Failed | Completed<A>

export interface Pending<A> {
  readonly _tag: 'Pending'
  readonly listeners: ReadonlyArray<FutureListener<A>>
}

export interface Failed {
  readonly _tag: 'Failed'
  readonly cause: Cause
}

export interface Completed<A> {
  readonly _tag: 'Completed'
  readonly value: A
}

export type FutureListener<A> = (exit: Exit<A>) => void

export const pending = <A>(): Pending<A> => ({
  _tag: 'Pending',
  listeners: [],
})

export const addListener =
  <A>(listener: FutureListener<A>) =>
  (state: Pending<A>): Pending<A> => ({ ...state, listeners: [...state.listeners, listener] })

export const failed = (cause: Cause): Failed => ({ _tag: 'Failed', cause })

export const success = <A>(value: A): Completed<A> => ({ _tag: 'Completed', value })

export const isPending = <A>(state: FutureState<A>): state is Pending<A> => state._tag === 'Pending'

export const isFailed = <A>(state: FutureState<A>): state is Failed => state._tag === 'Failed'

export const isCompleted = <A>(state: FutureState<A>): state is Completed<A> =>
  state._tag === 'Completed'

export function listen<A>(future: Future<A>): Fx.Fx<unknown, Exit<A>> {
  const state = future.getState()

  switch (state._tag) {
    case 'Completed':
      return Fx.of(E.right(state.value))
    case 'Failed':
      return Fx.of(E.left(state.cause))
    case 'Pending': {
      return Fx.Fx(function* () {
        const scope = yield* getScope
        const exit = yield* Fx.fromAsync<Exit<Exit<A>>>((cb) => {
          const updated = pipe(
            state,
            addListener((x) => cb(E.right(x))),
            future.setState,
          )

          if (updated) {
            return Uncancelable
          }

          return Fx.runToExit(listen(future), {}, cb, scope)
        })

        return E.flatten(exit)
      })
    }
  }
}
