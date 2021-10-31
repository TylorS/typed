import { Fx } from './Fx'

export function chain<A, R2, B>(f: (a: A) => Fx<R2, B>) {
  return <R>(fx: Fx<R, A>): Fx<R & R2, B> =>
    Fx(function* () {
      return yield* f(yield* fx)
    })
}
