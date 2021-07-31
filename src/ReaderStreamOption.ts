/**
 * ReaderStreamEither is an Option of ReaderStream, allowing for you to
 * represent your application over time with Stream, with support for Optionality
 * through Option, and dependency injection from Reader.
 *
 * @since 0.9.2
 */
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

/**
 * @since 0.9.2
 * @category Model
 */
export interface ReaderStreamOption<E, A> extends RS.ReaderStream<E, O.Option<A>> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = OT.alt(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = OT.ap(RS.Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = OT.chain(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainNullableK = OT.chainNullableK(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = OT.chainOptionK(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = OT.fromEither(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderStream = OT.fromF(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullable = OT.fromNullable(RS.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullableK = OT.fromNullableK(RS.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = OT.fromOptionK(RS.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = OT.fromPredicate(RS.Pointed)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElse = OT.getOrElse(RS.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElseE = OT.getOrElseE(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = OT.map(RS.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = OT.match(RS.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = OT.matchE(RS.Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const some = OT.some(RS.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero = OT.zero(RS.Pointed)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElseW = OT.getOrElse(RS.Functor) as <A>(
  onNone: Lazy<A>,
) => <E, B>(fa: RS.ReaderStream<E, O.Option<B>>) => RS.ReaderStream<E, A | B>

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElseEW = getOrElseE as <E1, A>(
  onNone: Lazy<RS.ReaderStream<E1, A>>,
) => <E2>(fa: RS.ReaderStream<E2, O.Option<A>>) => RS.ReaderStream<E1 & E2, A>

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ReaderStreamOption'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderStreamOption<E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed2<URI> = {
  of: flow(O.some, RS.of),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor2<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
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

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alternative: Alternative2<URI> = {
  ...Alt,
  zero,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FromIO2<URI> = {
  fromIO: flow(RS.fromIO, RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = FromIO.fromIO

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: flow(RS.fromTask, RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = FromTask.fromTask

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromResume: FromResume2<URI> = {
  fromResume: <A, E>(resume: Resume<A>) => pipe(RS.fromResume<A, E>(resume), RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume = FromResume.fromResume

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEnv: FromEnv2<URI> = {
  fromEnv: flow(RS.fromEnv, RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnv = FromEnv.fromEnv

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FromReader2<URI> = {
  fromReader: flow(RS.fromReader, RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader = FromReader.fromReader

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome2<URI> = {
  useSome: RS.useSome,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome = UseSome.useSome

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll2<URI> = {
  useAll: RS.useAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll = UseAll.useAll

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome: RS.provideSome,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome = ProvideSome.provideSome

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll: RS.provideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll = ProvideAll.provideAll

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide2<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

/**
 * @since 0.9.2
 * @category Constructor
 */
export const ask = FR.ask(FromReader)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const asks = FR.asks(FromReader)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderK = FR.fromReaderK(FromReader)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResumeK = FRe.fromResumeK(FromResume)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainEnvK = FE.chainEnvK(FromEnv, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnvK = FE.fromEnvK(FromEnv)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromStream: FS.FromStream2<URI> = {
  fromStream: flow(RS.fromStream, RS.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStream = FromStream.fromStream

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstStreamK = FS.chainFirstStreamK(FromStream, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainStreamK = FS.chainStreamK(FromStream, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStreamK = FS.fromStreamK(FromStream)
