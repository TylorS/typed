import * as E from '@fp/Env'
import * as FR from '@fp/FromResume'
import { flow } from '@fp/function'
import * as FxT from '@fp/FxT'
import * as PR from '@fp/Provide'
import * as Re from '@fp/Resume'
import * as Alt_ from 'fp-ts/Alt'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as ChR from 'fp-ts/ChainRec'
import * as FIO from 'fp-ts/FromIO'
import * as FRe from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import * as F from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import * as M from 'fp-ts/Monad'
import * as P from 'fp-ts/Pointed'
import * as R from 'fp-ts/Reader'
import * as T from 'fp-ts/Task'

import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doEnv = FxT.getDo<E.URI>()
export const liftEnv = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const constant = FxT.constant<E.URI>()
export const toEnv = FxT.toMonad<E.URI>(E.MonadRec) as <Y extends E.Env<any, any>, R>(
  fx: Fx<Y, R, unknown>,
) => [Y] extends [E.Env<infer E, any>] ? E.Env<E, R> : never
export const Do = flow(doEnv, toEnv)

export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
export const fromIO = FxT.fromNaturalTransformation<IO.URI, E.URI>(E.fromIO)
export const fromIOK = FxT.fromNaturalTransformationK<IO.URI, E.URI>(E.fromIO)
export const fromResume = FxT.fromNaturalTransformation<Re.URI, E.URI>(E.fromResume)
export const fromResumeK = FxT.fromNaturalTransformationK<Re.URI, E.URI>(E.fromResume)
export const fromTask = FxT.fromNaturalTransformation<T.URI, E.URI>(E.fromTask)
export const fromTaskK = FxT.fromNaturalTransformationK<T.URI, E.URI>(E.fromTask)
export const fromReader = FxT.fromNaturalTransformation<R.URI, E.URI>(E.fromReader)
export const fromReaderK = FxT.fromNaturalTransformationK<R.URI, E.URI>(E.fromReader)

export const asks = fromReader
export const ask = FxT.ask(E.FromReader)

export const URI = '@typed/fp/Fx/Env'
export type URI = typeof URI

export interface FxEnv<E, A> extends Fx<E.Env<E, unknown>, A> {}

export type RequirementsOf<A> = A extends FxEnv<infer E, any> ? E : never

export type ValueOf<A> = A extends FxEnv<any, infer R> ? R : never

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxEnv<E, A>
  }
}

export const Pointed: P.Pointed2<URI> = {
  of,
}

export const Functor: F.Functor2<URI> = {
  map,
}

export const flap = F.flap(Functor)
export const tupled = F.tupled(Functor)

export const Apply: Ap.Apply2<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)

export const Applicative: App.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Ch.Chain2<URI> = {
  ...Functor,
  chain,
}

export const chainFirst = Ch.chainFirst(Chain)

export const Monad: M.Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChR.ChainRec2<URI> = {
  chainRec,
}

export const FromReader: FRe.FromReader2<URI> = {
  fromReader,
}

export const chainFirstReaderK = FRe.chainFirstReaderK(FromReader, Chain)
export const chainReaderK = FRe.chainReaderK(FromReader, Chain)

export const FromIO: FIO.FromIO2<URI> = {
  fromIO,
}

export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
export const chainIOK = FIO.chainIOK(FromIO, Chain)

export const FromTask: FT.FromTask2<URI> = {
  fromIO,
  fromTask,
}

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)

export const FromResume: FR.FromResume2<URI> = {
  fromResume,
}

export const chainFirstResumeK = FR.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FR.chainResumeK(FromResume, Chain)

export const UseSome: PR.UseSome2<URI> = {
  useSome,
}

export const UseAll: PR.UseAll2<URI> = {
  useAll,
}

export const ProvideSome: PR.ProvideSome2<URI> = {
  provideSome,
}

export const ProvideAll: PR.ProvideAll2<URI> = {
  provideAll,
}

export const Provide: PR.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export const askAndProvide = PR.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })
export const askAndUse = PR.askAndUse({ ...UseAll, ...Chain, ...FromReader })
export const provideAllWith = PR.provideAllWith({ ...ProvideAll, ...Chain, ...FromReader })
export const useAllWith = PR.useAllWith({ ...UseAll, ...Chain, ...FromReader })
export const provideSomeWith = PR.provideSomeWith({ ...ProvideSome, ...Chain, ...FromReader })
export const useSomeWith = PR.useSomeWith({ ...UseSome, ...Chain, ...FromReader })

export const raceW =
  <E1, A>(a: FxEnv<E1, A>) =>
  <E2, B>(b: FxEnv<E2, B>) =>
    liftEnv(E.raceW(toEnv(a))(toEnv(b)))

export const race =
  <E, A>(a: FxEnv<E, A>) =>
  <B>(b: FxEnv<E, B>) =>
    liftEnv(E.race(toEnv(a))(toEnv(b)))

export const Alt: Alt_.Alt2<URI> = {
  ...Functor,
  alt: (second) => (first) => race(second())(first),
}

export const alt = Alt.alt
export const altAll = Alt_.altAll(Alt)

export const zipW = <Fxs extends ReadonlyArray<FxEnv<any, any>>>(fxs: Fxs) =>
  liftEnv(
    E.zipW(
      fxs.map(toEnv) as any as {
        readonly [K in keyof Fxs]: E.Env<RequirementsOf<Fxs[K]>, ValueOf<Fxs[K]>>
      },
    ),
  )

export const zip = <Fxs extends ReadonlyArray<FxEnv<any, any>>>(fxs: Fxs) =>
  liftEnv(
    E.zip(
      fxs.map(toEnv) as any as {
        readonly [K in keyof Fxs]: E.Env<RequirementsOf<Fxs[K]>, ValueOf<Fxs[K]>>
      },
    ),
  )
