import { identity } from '@/Prelude/function'
import { None } from '@/Prelude/None'
import { Some } from '@/Prelude/Some'

export type Option<A> = Some<A> | None

export { None, Some }

export const isNone = <A>(option: Option<A>): option is None => option.type === 'None'

export const isSome = <A>(option: Option<A>): option is Some<A> => option.type === 'Some'

export const match =
  <A, B, C>(onNone: () => A, onSome: (value: B) => C) =>
  (option: Option<B>): A | C =>
    isNone(option) ? onNone() : onSome(option.value)

export const getOrElse =
  <A>(f: () => A) =>
  <B>(option: Option<B>): A | B =>
    match(f, identity)(option)

export const fromNullable = <A>(value: A | null | undefined | void): Option<A> => {
  if (value === null || value === undefined) {
    return None
  }

  return Some(value)
}

export const map =
  <A, B>(f: (a: A) => B) =>
  (option: Option<A>): Option<B> =>
    isSome(option) ? Some(f(option.value)) : option
