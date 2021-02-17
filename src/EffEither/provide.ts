import { EffEither, fromEnvEither, toEnvEither } from './EffEither'

export function useSome<R1>(provided: R1) {
  return <R2, E, A>(eff: EffEither<R1 & R2, E, A>): EffEither<R2, E, A> =>
    fromEnvEither((env) => toEnvEither(eff)({ ...env, ...provided }))
}

export function provideSome<R1>(provided: R1) {
  return <R2, E, A>(eff: EffEither<R1 & R2, E, A>): EffEither<R2, E, A> =>
    fromEnvEither((env) => toEnvEither(eff)({ ...provided, ...env }))
}

export function useAll<R>(env: R) {
  return <E, A>(eff: EffEither<R, E, A>): EffEither<never, E, A> =>
    fromEnvEither(() => toEnvEither(eff)(env))
}

export function provideAll<R>(provided: R) {
  return <E, A>(eff: EffEither<R, E, A>): EffEither<never, E, A> =>
    fromEnvEither((env: {}) => toEnvEither(eff)({ ...provided, ...env }))
}
