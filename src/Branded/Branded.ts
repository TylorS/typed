export type Branded<T, Brand> = T & { readonly __not_available_at_runtime__: Brand }

export type BrandOf<A> = '__not_available_at_runtime__' extends keyof A
  ? A['__not_available_at_runtime__']
  : never

export type TypeOf<A> = A extends Branded<infer T, BrandOf<A>> ? T : never

export const Branded =
  <B extends Branded<any, any>>() =>
  <T extends TypeOf<B>>(type: T): Branded<T, BrandOf<B>> =>
    type as Branded<T, BrandOf<B>>
