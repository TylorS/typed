export interface FunctionN<A extends ReadonlyArray<any>, B> {
  (...args: A): B
}

export type Arity1<A, B> = FunctionN<readonly [A], B>
export type Arity2<A, B, C> = FunctionN<readonly [A, B], C>
export type Arity3<A, B, C, D> = FunctionN<readonly [A, B, C], D>
export type Arity4<A, B, C, D, E> = FunctionN<readonly [A, B, C, D], E>
export type Arity5<A, B, C, D, E, F> = FunctionN<readonly [A, B, C, D, E], F>
