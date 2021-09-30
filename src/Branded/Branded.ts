import { unsafeCoerce } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'
import { Predicate } from 'fp-ts/Predicate'

export type Branded<T, Brand extends Readonly<Record<PropertyKey, any>>> = T & {
  readonly BRAND: {
    readonly __not_available_at_runtime__: Brand
  }
}

export type BrandOf<T> = [T] extends [Branded<unknown, infer Brand>] ? Brand : never

export type TypeOf<A> = A extends Branded<infer T, BrandOf<A>> ? T : never

export const Branded =
  <T extends Branded<any, any>>() =>
  <A extends TypeOf<T>>(value: A): Branded<A, BrandOf<T>> =>
    unsafeCoerce(value)

export const fromPredicate =
  <T extends Branded<any, any>>(predicate: Predicate<TypeOf<T>>) =>
  <A extends TypeOf<T>>(value: A): Option<Branded<A, BrandOf<T>>> =>
    predicate(value) ? some(Branded<T>()(value)) : none

export const fromAssertion =
  <T extends Branded<any, any>>(predicate: (type: unknown) => asserts type is T) =>
  <A extends TypeOf<T>>(value: A): Branded<A, BrandOf<T>> => {
    predicate(value)

    return value as Branded<A, BrandOf<T>>
  }

export type Combine<L extends Branded<any, any>, R extends Branded<any, any>> = Branded<
  TypeOf<L> & TypeOf<R>,
  BrandOf<L> & BrandOf<R>
>
