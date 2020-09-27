import { Arity1 } from '@typed/fp/common/exports'
import { map, Pure } from '@typed/fp/Effect/exports'
import { flow } from 'fp-ts/function'
import { Invariant1 } from 'fp-ts/Invariant'

export type UseState<A> = readonly [Pure<A>, UpdateState<A>]
export type UpdateState<A> = (update: Arity1<A, A>) => Pure<A>

export const UseStateUri = '@typed/fp/UseState'
export type UseStateUri = typeof UseStateUri

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [UseStateUri]: UseState<A>
  }
}

export const imap = <A, B>(f: Arity1<A, B>, g: Arity1<B, A>) => <C extends ReadonlyArray<any>>([
  getA,
  updateA,
  ...c
]: readonly [...UseState<A>, ...C]): readonly [...UseState<B>, ...C] => [
  map(f, getA),
  (updateB) => map(f, updateA(flow(f, updateB, g))),
  ...c,
]

export const invariant: Invariant1<UseStateUri> = {
  URI: UseStateUri,
  imap: (state, f, g) => imap(f, g)(state),
}
