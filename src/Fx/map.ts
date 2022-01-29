import { Fx } from './Fx'

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(fx: Fx<R, E, A>) =>
    Fx(function* () {
      return f(yield* fx)
    })
