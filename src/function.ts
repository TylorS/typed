import { FunctionN } from 'fp-ts/function'

export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never

export type AnyFn<R = any> = FunctionN<readonly any[], R>

export type Arity1<A, B> = FunctionN<[a: A], B>
export type Arity2<A, B, C> = FunctionN<[a: A, b: B], C>
export type Arity3<A, B, C, D> = FunctionN<[a: A, b: B, c: C], D>
export type Arity4<A, B, C, D, E> = FunctionN<[a: A, b: B, c: C, d: D], E>
export type Arity5<A, B, C, D, E, F> = FunctionN<[a: A, b: B, c: C, d: D, e: E], F>

export * from 'fp-ts/function'
