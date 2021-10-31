import { unsafeCoerce } from 'fp-ts/function'

export type Branded<T, Brand> = T & { __brand__not__available__at__runtime__: Brand }

export type BrandOf<T> = '__brand__not__available__at__runtime__' extends keyof T
  ? T['__brand__not__available__at__runtime__']
  : never

export type TypeOf<T> = T extends Branded<infer Type, BrandOf<T>> ? Type : never

export const Branded =
  <B extends Branded<any, any>>() =>
  <A extends TypeOf<B>>(type: A): Branded<A, BrandOf<B>> =>
    unsafeCoerce(type)
