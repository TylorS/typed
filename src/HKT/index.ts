export enum Params {
  S = 'S',
  R = 'R',
  E = 'E',
  A = 'A',
}

export const S = Params.S
export const R = Params.R
export const E = Params.E
export const A = Params.A

export interface HKT {
  readonly type: unknown
  readonly [S]: unknown
  readonly [R]: unknown
  readonly [E]: unknown
  readonly [A]: unknown
}

export type KindParams =
  | readonly [any]
  | readonly [any, any]
  | readonly [any, any, any]
  | readonly [any, any, any, any]

export type Kind<T extends HKT, S, R, E, A> = (T & {
  readonly [S]: S
  readonly [R]: R
  readonly [E]: E
  readonly [A]: A
})['type']
