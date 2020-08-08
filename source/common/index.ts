export type ArgsOf<A> = A extends (...args: infer R) => any ? R : never

export type Arity1<A = any, B = any> = (value: A) => B
export type Arity2<A = any, B = any, C = any> = (a: A, b: B) => C
export type Arity3<A = any, B = any, C = any, D = any> = (a: A, b: B, c: C) => D
export type Arity4<A = any, B = any, C = any, D = any, E = any> = (a: A, b: B, c: C, d: D) => E
export type Arity5<A = any, B = any, C = any, D = any, E = any, F = any> = (
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
) => F
