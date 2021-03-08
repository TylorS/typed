import { Reader, URI } from 'fp-ts/dist/Reader'

import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '@typed/fp/Provide'

export function useSome<E1>(provided: E1) {
  return <E2, A>(eff: Reader<E1 & E2, A>): Reader<E2, A> => (env) => eff({ ...env, ...provided })
}

export function provideSome<E1>(provided: E1) {
  return <E2, A>(eff: Reader<E1 & E2, A>): Reader<E2, A> => (env) => eff({ ...provided, ...env })
}

export function useAll<E>(env: E) {
  return <A>(eff: Reader<E, A>): Reader<never, A> => () => eff(env)
}

export function provideAll<E>(provided: E) {
  return <A>(eff: Reader<E, A>): Reader<never, A> => (env: never) =>
    eff({ ...provided, ...(env as {}) })
}

export const UseSome: UseSome2<URI> = { useSome }

export const ProvideSome: ProvideSome2<URI> = { provideSome }

export const UseAll: UseAll2<URI> = { useAll }

export const ProvideAll: ProvideAll2<URI> = { provideAll }

export const Provider: Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
