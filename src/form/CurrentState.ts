import { Arity1 } from '@typed/fp/common/exports'
import { chain, doEffect, Effect, map, Pure } from '@typed/fp/Effect/exports'
import { UpdateState, UseState, useState } from '@typed/fp/hooks/exports'
import { Eq } from 'fp-ts/Eq'
import { flow } from 'fp-ts/function'
import { Invariant1 } from 'fp-ts/Invariant'

export type CurrentState<A> = readonly [A, UpdateState<A>]

export const CurrentStateUri = '@typed/fp/CurrentState'
export type CurrentStateUri = typeof CurrentStateUri

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [CurrentStateUri]: CurrentState<A>
  }
}

export const imap = <A, B>(f: Arity1<A, B>, g: Arity1<B, A>) => <C extends ReadonlyArray<any>>([
  a,
  updateA,
  ...c
]: readonly [...CurrentState<A>, ...C]): readonly [...CurrentState<B>, ...C] => [
  f(a),
  (updateB) => map(f, updateA(flow(f, updateB, g))),
  ...c,
]

export const invariant: Invariant1<CurrentStateUri> = {
  URI: CurrentStateUri,
  imap: (state, f, g) => imap(f, g)(state),
}

export const getCurrentState = <A>(state: UseState<A>): Pure<CurrentState<A>> =>
  doEffect(function* () {
    const [getState, updateState] = state

    return [yield* getState, updateState] as const
  })

export const useCurrentState = <E, A>(initial: Effect<E, A>, eq?: Eq<A>) =>
  chain(getCurrentState, eq ? useState(initial, eq) : useState(initial))
