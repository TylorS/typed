/**
 * EnvOption is an @see OptionT of @see Env
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

import * as E from './Env'
import * as FE from './FromEnv'
import { FromEnv2 } from './FromEnv'
import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'
import { Resume } from './Resume'

/**
 * @since 0.9.2
 * @category Model
 */
export interface EnvOption<E, A> extends E.Env<E, O.Option<A>> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = OT.alt(E.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = OT.ap(E.Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = OT.chain(E.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainNullableK = OT.chainNullableK(E.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = OT.chainOptionK(E.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = OT.fromEither(E.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnv = OT.fromF(E.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullable = OT.fromNullable(E.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullableK = OT.fromNullableK(E.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = OT.fromOptionK(E.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = OT.fromPredicate(E.Pointed)
/**
 * @since 0.9.2
 * @category Deconstuctor
 */
export const getOrElse = OT.getOrElse(E.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElseE = OT.getOrElseE(E.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = OT.map(E.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = OT.match(E.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = OT.matchE(E.Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const some = OT.some(E.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero = OT.zero(E.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseEW = getOrElseE as <E1, A>(
  onNone: Lazy<E.Env<E1, A>>,
) => <E2>(fa: E.Env<E2, O.Option<A>>) => E.Env<E1 & E2, A>

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/EnvOption'

/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: EnvOption<E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed2<URI> = {
  of: flow(O.some, E.of),
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
  <A, E, B>(f: (value: A) => EnvOption<E, Ei.Either<A, B>>) =>
  (value: A): EnvOption<E, B> =>
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
  fromIO: flow(E.fromIO, E.map(O.some)),
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
  fromTask: flow(E.fromTask, E.map(O.some)),
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
  fromResume: <A, E>(resume: Resume<A>) => pipe(E.fromResume<A, E>(resume), E.map(O.some)),
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
  fromEnv,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FromReader2<URI> = {
  fromReader: flow(E.fromReader, E.map(O.some)),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome2<URI> = {
  useSome: E.useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll2<URI> = {
  useAll: E.useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome2<URI> = {
  provideSome: E.provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll2<URI> = {
  provideAll: E.provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide2<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

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
