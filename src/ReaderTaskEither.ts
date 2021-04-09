import { ChainRec3 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'

import { swapEithers } from './internal'
import { MonadRec3 } from './MonadRec'
import { Provide3, ProvideAll3, ProvideSome3, UseAll3, UseSome3 } from './Provide'
import * as RT from './ReaderTask'

export const chainRec = <A, R, E, B>(
  f: (value: A) => RTE.ReaderTaskEither<R, E, E.Either<A, B>>,
) => (value: A): RTE.ReaderTaskEither<R, E, B> =>
  pipe(
    value,
    RT.chainRec((a) => pipe(a, f, RT.map(swapEithers))),
  )

export const ChainRec: ChainRec3<RTE.URI> = {
  chainRec,
}

export const MonadRec: MonadRec3<RTE.URI> = {
  ...RTE.Monad,
  chainRec,
}

export const UseSome: UseSome3<RTE.URI> = {
  useSome: RT.useSome,
}

export const useSome = UseSome.useSome

export const ProvideSome: ProvideSome3<RTE.URI> = {
  provideSome: RT.provideSome,
}

export const provideSome = ProvideSome.provideSome

export const UseAll: UseAll3<RTE.URI> = {
  useAll: RT.useAll,
}

export const useAll = UseAll.useAll

export const ProvideAll: ProvideAll3<RTE.URI> = {
  provideAll: RT.provideAll,
}

export const provideAll = ProvideAll.provideAll

export const Provide: Provide3<RTE.URI> = {
  ...UseSome,
  ...UseAll,
  ...ProvideSome,
  ...ProvideAll,
}

export * from 'fp-ts/ReaderTaskEither'
