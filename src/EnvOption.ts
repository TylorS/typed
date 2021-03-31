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
import { flow, pipe } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed2 } from 'fp-ts/Pointed'

import * as E from './Env'
import * as FE from './FromEnv'
import { FromEnv2 } from './FromEnv'
import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import { Kind } from './Hkt'
import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'
import { Resume } from './Resume'

export type EnvOption<E, A> = Kind<[E.URI, O.URI], [E, A]>

export const alt = OT.alt(E.Monad)
export const ap = OT.ap(E.Apply)
export const chain = OT.chain(E.Monad)
export const chainNullableK = OT.chainNullableK(E.Monad)
export const chainOptionK = OT.chainOptionK(E.Monad)
export const fromEither = OT.fromEither(E.Monad)
export const fromEnv = OT.fromF(E.Monad)
export const fromNullable = OT.fromNullable(E.Pointed)
export const fromNullableK = OT.fromNullableK(E.Pointed)
export const fromOptionK = OT.fromOptionK(E.Pointed)
export const fromPredicate = OT.fromPredicate(E.Pointed)
export const getOrElse = OT.getOrElse(E.Functor)
export const getOrElseE = OT.getOrElseE(E.Monad)
export const map = OT.map(E.Functor)
export const match = OT.match(E.Functor)
export const matchE = OT.matchE(E.Chain)
export const some = OT.some(E.Pointed)
export const zero = OT.zero(E.Pointed)

export const URI = '@typed/fp/EnvOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: EnvOption<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of: flow(O.some, E.of),
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

export const chainRec = <A, E, B>(f: (value: A) => EnvOption<E, Ei.Either<A, B>>) => (
  value: A,
): EnvOption<E, B> =>
  pipe(
    value,
    E.chainRec((a) =>
      pipe(
        a,
        f,
        E.map((oe) => {
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
  fromIO: flow(E.fromIO, E.map(O.some)),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: flow(E.fromTask, E.map(O.some)),
}

export const fromTask = FromTask.fromTask

export const FromResume: FromResume2<URI> = {
  fromResume: <A, E>(resume: Resume<A>) => pipe(E.fromResume<A, E>(resume), E.map(O.some)),
}

export const fromResume = FromResume.fromResume

export const FromEnv: FromEnv2<URI> = {
  fromEnv,
}

export const FromReader: FromReader2<URI> = {
  fromReader: flow(E.fromReader, E.map(O.some)),
}

export const UseSome: UseSome2<URI> = {
  useSome: E.useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll: E.useAll,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome: E.provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll: E.provideAll,
}

export const Provide: Provide2<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

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
