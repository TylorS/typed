import { Env } from './Env'

export function useSome<E1>(provided: E1) {
  return <E2, A>(eff: Env<E1 & E2, A>): Env<E2, A> => (env) => eff({ ...env, ...provided })
}

export function provideSome<E1>(provided: E1) {
  return <E2, A>(eff: Env<E1 & E2, A>): Env<E2, A> => (env) => eff({ ...provided, ...env })
}

export function useAll<E>(env: E) {
  return <A>(eff: Env<E, A>): Env<never, A> => () => eff(env)
}

export function provideAll<E>(provided: E): <A>(eff: Env<E, A>) => Env<never, A> {
  return provideSome(provided)
}
