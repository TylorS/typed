import * as M from '@/Magma'

export interface Semigroup<A> extends M.Magma<A> {}

export const concatAll: <A>(S: Semigroup<A>) => (startWith: A) => (as: ReadonlyArray<A>) => A =
  M.concatAll
