import { Alt2 } from 'fp-ts/Alt'
import { Alternative2 } from 'fp-ts/Alternative'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as Ei from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import { FromReader2 } from 'fp-ts/FromReader'
import { FromTask2 } from 'fp-ts/FromTask'
import { flow, Lazy, pipe } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FE from './FromEnv'
import { FromEnv2 } from './FromEnv'
import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import * as FS from './FromStream'
import { MonadRec2 } from './MonadRec'
import * as P from './Provide'
import * as RS from './ReaderStream'
import { Resume } from './Resume'

export interface ReaderStreamOption<E, A> extends RS.ReaderStream<E, O.Option<A>> {}

export const alt = OT.alt(RS.Monad)
export const ap = OT.ap(RS.Apply)
export const chain = OT.chain(RS.Monad)
export const chainNullableK = OT.chainNullableK(RS.Monad)
export const chainOptionK = OT.chainOptionK(RS.Monad)
export const fromEither = OT.fromEither(RS.Monad)
export const fromReaderStream = OT.fromF(RS.Monad)
export const fromNullable = OT.fromNullable(RS.Pointed)
export const fromNullableK = OT.fromNullableK(RS.Pointed)
export const fromOptionK = OT.fromOptionK(RS.Pointed)
export const fromPredicate = OT.fromPredicate(RS.Pointed)
export const getOrElse = OT.getOrElse(RS.Functor)
export const getOrElseE = OT.getOrElseE(RS.Monad)
export const map = OT.map(RS.Functor)
export const match = OT.match(RS.Functor)
export const matchE = OT.matchE(RS.Chain)
export const some = OT.some(RS.Pointed)
export const zero = OT.zero(RS.Pointed)

export const getOrElseW = OT.getOrElse(RS.Functor) as <A>(
  onNone: Lazy<A>,
) => <E, B>(fa: RS.ReaderStream<E, O.Option<B>>) => RS.ReaderStream<E, A | B>

export const getOrElseEW = getOrElseE as <E1, A>(
  onNone: Lazy<RS.ReaderStream<E1, A>>,
) => <E2>(fa: RS.ReaderStream<E2, O.Option<A>>) => RS.ReaderStream<E1 & E2, A>

export const URI = '@typed/fp/ReaderStreamOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderStreamOption<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of: flow(O.some, RS.of),
}

export const Functor: Functor2<URI> = {
  map,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const chainRec =
  <A, E, B>(f: (value: A) => ReaderStreamOption<E, Ei.Either<A, B>>) =>
  (value: A): ReaderStreamOption<E, B> =>
    pipe(
      value,
      RS.chainRec((a) =>
        pipe(
          a,
          f,
          RS.map((oe) => {
            if (O.isNone(oe)) {
              return Ei.right(oe)
            }

            return pipe(oe.value, Ei.map(O.some))
          }),
        ),
      ),
    )

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

export const Alternative: Alternative2<URI> = {
  ...Alt,
  zero,
}

export const FromIO: FromIO2<URI> = {
  fromIO: flow(RS.fromIO, RS.map(O.some)),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: flow(RS.fromTask, RS.map(O.some)),
}

export const fromTask = FromTask.fromTask

export const FromResume: FromResume2<URI> = {
  fromResume: <A, E>(resume: Resume<A>) => pipe(RS.fromResume<A, E>(resume), RS.map(O.some)),
}

export const fromResume = FromResume.fromResume

export const FromEnv: FromEnv2<URI> = {
  fromEnv: flow(RS.fromEnv, RS.map(O.some)),
}

export const fromEnv = FromEnv.fromEnv

export const FromReader: FromReader2<URI> = {
  fromReader: flow(RS.fromReader, RS.map(O.some)),
}

export const fromReader = FromReader.fromReader

export const UseSome: P.UseSome2<URI> = {
  useSome: RS.useSome,
}

export const useSome = UseSome.useSome

export const UseAll: P.UseAll2<URI> = {
  useAll: RS.useAll,
}

export const useAll = UseAll.useAll

export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome: RS.provideSome,
}

export const provideSome = ProvideSome.provideSome

export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll: RS.provideAll,
}

export const provideAll = ProvideAll.provideAll

export const Provide: P.Provide2<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })
export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)

export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
export const fromResumeK = FRe.fromResumeK(FromResume)

export const chainEnvK = FE.chainEnvK(FromEnv, Chain)
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)
export const fromEnvK = FE.fromEnvK(FromEnv)

export const FromStream: FS.FromStream2<URI> = {
  fromStream: flow(RS.fromStream, RS.map(O.some)),
}

export const fromStream = FromStream.fromStream

export const chainFirstStreamK = FS.chainFirstStreamK(FromStream, Chain)
export const chainStreamK = FS.chainStreamK(FromStream, Chain)
export const fromStreamK = FS.fromStreamK(FromStream)
