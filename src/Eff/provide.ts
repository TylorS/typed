import { Pure } from '@typed/fp/Fx'
import { WidenI } from '@typed/fp/Widen'

import { Eff, fromEnv, toEnv } from './Eff'

export function useSome<E1>(provided: E1) {
  return <E2, A>(eff: Eff<WidenI<E1 | E2>, A>): Eff<E2, A> =>
    fromEnv((env) => toEnv(eff)({ ...env, ...provided } as WidenI<E1 | E2>))
}

export function provideSome<E1>(provided: E1) {
  return <E2, A>(eff: Eff<WidenI<E1 | E2>, A>): Eff<E2, A> =>
    fromEnv((env) => toEnv(eff)({ ...provided, ...env } as WidenI<E1 | E2>))
}

export function useAll<E>(env: E) {
  return <A>(eff: Eff<E, A>): Pure<A> => fromEnv(() => toEnv(eff)(env)) as Pure<A>
}

export function provideAll<E>(provided: E) {
  return <A>(eff: Eff<E, A>): Pure<A> =>
    fromEnv((env: never) => toEnv(eff)({ ...provided, ...(env as {}) })) as Pure<A>
}
