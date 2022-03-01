import { identity } from '../function'

export interface Reader<R, A> {
  readonly [Symbol.iterator]: () => Generator<(r: R) => any, A>
}

export function asks<R, A>(f: (r: R) => A): Reader<R, A> {
  return {
    *[Symbol.iterator]() {
      return (yield f) as A
    },
  }
}

export function ask<R>(): Reader<R, R> {
  return asks(identity)
}

export function Reader<G extends Generator<(r: any) => any, any>>(
  f: () => G,
): Reader<GeneratorResources<G>, GeneratorOutput<G>> {
  return {
    [Symbol.iterator]: f,
  }
}

export type GeneratorResources<T> = [T] extends [Generator<(r: infer R) => infer _, infer _>]
  ? R
  : unknown

export type GeneratorOutput<T> = [T] extends [Generator<any, infer R>] ? R : unknown

export const run =
  <R>(resources: R) =>
  <A>(reader: Reader<R, A>): A => {
    const gen = reader[Symbol.iterator]()
    let result = gen.next()

    while (!result.done) {
      result = gen.next(result.value(resources))
    }

    return result.value
  }

export const chain =
  <A, R2, B>(f: (a: A) => Reader<R2, B>) =>
  <R>(reader: Reader<R, A>): Reader<R & R2, B> =>
    Reader(function* () {
      return yield* f(yield* reader)
    })

export const map =
  <A, B>(f: (a: A) => B) =>
  <R>(reader: Reader<R, A>): Reader<R, B> =>
    Reader(function* () {
      return f(yield* reader)
    })
