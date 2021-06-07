import * as C from 'fp-ts/Const'

export type BrandOf<A> = A extends C.Const<infer _, infer R> ? R : never
export type ValueOf<A> = A extends infer E & { readonly _A: BrandOf<A> } ? E : never

export type Const<E, A> = C.Const<E, A>
export const Const =
  <A extends C.Const<any, any>>() =>
  <E extends ValueOf<A>>(e: E): C.Const<E, BrandOf<A>> =>
    C.make<E, BrandOf<A>>(e)

export * from 'fp-ts/Const'
