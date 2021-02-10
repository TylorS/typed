import { Pure } from '@fp/Fx'
import { intersect, Widen } from '@fp/Widen'

import { Eff, fromEnv, toEnv } from './Eff'

export function useSome<E1>(provided: E1) {
  return <E2, A>(eff: Eff<E1 & E2, A>): Eff<E2, A> =>
    fromEnv((env) => toEnv(eff)(intersect(env, provided)))
}

export function provideSome<E1>(provided: E1) {
  return <E2, A>(eff: Eff<E1 & E2, A>): Eff<E2, A> =>
    fromEnv((env) => toEnv(eff)(intersect(provided, env)))
}

export function useAll<E>(env: E) {
  return <A>(eff: Eff<E, A>): Pure<A> =>
    fromEnv(() => toEnv(eff)(env as Widen<E, 'intersection'>)) as Pure<A>
}

export const provideAll = useAll
