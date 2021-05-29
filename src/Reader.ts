import { pipe } from '@fp/function'
import { MonadRec2 } from '@fp/MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '@fp/Provide'
import { ChainRec2, tailRec } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as R from 'fp-ts/Reader'

export * from 'fp-ts/Reader'

export const chainRec = <A, R, B>(f: (value: A) => R.Reader<R, E.Either<A, B>>) => (
  value: A,
): R.Reader<R, B> => (r) =>
  pipe(
    value,
    tailRec((a: A) => f(a)(r)),
  )

export const ChainRec: ChainRec2<R.URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<R.URI> = {
  ...R.Monad,
  chainRec,
}

export const useSome = <R1>(provided: R1) => <R2, A>(
  reader: R.Reader<R1 & R2, A>,
): R.Reader<R2, A> => (e) => reader({ ...e, ...provided })

export const provideSome = <R1>(provided: R1) => <R2, A>(
  reader: R.Reader<R1 & R2, A>,
): R.Reader<R2, A> => (e) => reader({ ...provided, ...e })

export const useAll = <R1>(provided: R1) => <A>(
  reader: R.Reader<R1, A>,
): R.Reader<unknown, A> => () => reader(provided)

export const provideAll = <R1>(provided: R1) => <A>(
  reader: R.Reader<R1, A>,
): R.Reader<unknown, A> => (e) => reader({ ...provided, ...((e as any) ?? {}) })

export const UseSome: UseSome2<R.URI> = {
  useSome,
}

export const UseAll: UseAll2<R.URI> = {
  useAll,
}

export const ProvideSome: ProvideSome2<R.URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll2<R.URI> = {
  provideAll,
}

export const Provide: Provide2<R.URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
