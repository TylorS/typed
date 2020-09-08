import { IsNever } from './types'

export type DropNever<A> = { readonly [K in DropNeverKeys<A>]: A[K] }

export type DropNeverKeys<A> = {
  readonly [K in keyof A]: IsNever<A[K]> extends true ? never : K
}[keyof A]
