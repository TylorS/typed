export enum Params {
  Z = 'Z',
  Y = 'Y',
  X = 'X',
  W = 'W',
  V = 'V',
  U = 'U',
  S = 'S',
  R = 'R',
  E = 'E',
  A = 'A',
}

export const Z = Params.Z
export const Y = Params.Y
export const X = Params.X
export const W = Params.W
export const V = Params.V
export const U = Params.U
export const S = Params.S
export const R = Params.R
export const E = Params.E
export const A = Params.A

export interface HKT {
  readonly type: unknown
  readonly [A]: unknown
}

export interface HKT2 extends HKT {
  readonly [E]: unknown
}

export interface HKT3 extends HKT2 {
  readonly [R]: unknown
}

export interface HKT4 extends HKT3 {
  readonly [S]: unknown
}

export interface HKT5 extends HKT4 {
  readonly [U]: unknown
}

export interface HKT6 extends HKT5 {
  readonly [V]: unknown
}

export interface HKT7 extends HKT6 {
  readonly [W]: unknown
}

export interface HKT8 extends HKT7 {
  readonly [X]: unknown
}

export interface HKT9 extends HKT8 {
  readonly [Y]: unknown
}

export interface HKT10 extends HKT9 {
  readonly [Z]: unknown
}

export type Kind<T extends HKT, A> = (CoerceNever<T> & { readonly [A]: A })['type']

export type Kind2<T extends HKT2, E, A> = (CoerceNever<T> & {
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind3<T extends HKT3, R, E, A> = (CoerceNever<T> & {
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind4<T extends HKT4, S, R, E, A> = (CoerceNever<T> & {
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind5<T extends HKT5, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind6<T extends HKT5, V, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [V]: V
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind7<T extends HKT5, W, V, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [W]: W
  readonly [V]: V
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind8<T extends HKT5, X, W, V, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [X]: X
  readonly [W]: W
  readonly [V]: V
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind9<T extends HKT5, Y, X, W, V, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [Y]: Y
  readonly [X]: X
  readonly [W]: W
  readonly [V]: V
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type Kind10<T extends HKT5, Z, Y, X, W, V, U, S, R, E, A> = (CoerceNever<T> & {
  readonly [Z]: Z
  readonly [Y]: Y
  readonly [X]: X
  readonly [W]: W
  readonly [V]: V
  readonly [U]: U
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']

export type CoerceNever<T> = {
  readonly [K in keyof T]: [T[K]] extends [never] ? unknown : T[K]
}

export type TypeOf<T> = 'type' extends keyof T ? T['type'] : never
