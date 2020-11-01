import { Eq, eqStrict, getTupleEq } from 'fp-ts/Eq'

export type EqsOf<A extends ReadonlyArray<any>> = {
  [K in keyof A]: Eq<A[K]>
}

type EqFrom<A> = [A] extends [EqsOf<infer R>] ? Eq<R> : never

export const defaultEqs = <A extends ReadonlyArray<any>>(deps: A): EqsOf<A> =>
  (deps.map(() => eqStrict) as unknown) as EqsOf<A>

export const tupleEqOf = <A extends EqsOf<ReadonlyArray<any>>>(eqsOf: A): EqFrom<A> =>
  (getTupleEq(...eqsOf) as unknown) as EqFrom<A>
