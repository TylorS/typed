/**
 * @typed/fp/FxEnvEither is a generator-based do-notation for EnvEither.
 *
 * @since 0.13.0
 */
import { Applicative3 } from 'fp-ts/Applicative'
import { Apply3 } from 'fp-ts/Apply'
import { Chain3 } from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import * as EI from 'fp-ts/Either'
import { FromReader3 } from 'fp-ts/FromReader'
import { Functor3 } from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import * as E from './Env'
import * as EE from './EnvEither'
import { flow, Lazy } from './function'
import { Fx } from './Fx'
import * as FxT from './FxT'
import * as P from './Provide'
import * as R from './Reader'

/**
 * @category Constructor
 * @since 0.13.0
 */
export const of = FxT.of(EE.Pointed)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const ap = FxT.ap({ ...EE.MonadRec, ...EE.Apply })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const chain = FxT.chain<EE.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const chainRec = FxT.chainRec(EE.MonadRec)
/**
 * @category Do
 * @since 0.13.0
 */
export const doEnvEither = FxT.getDo<EE.URI>()
/**
 * @category Constructor
 * @since 0.13.0
 */
export const liftEnvEither = FxT.liftFx<EE.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const map = FxT.map<EE.URI>()
/**
 * @category Interpreter
 * @since 0.13.0
 */
export const toEnvEither = FxT.toMonad<EE.URI>(EE.MonadRec)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const ask = FxT.ask(EE.FromReader)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const asks = FxT.fromNaturalTransformation<R.URI, EE.URI>(EE.fromReader)

/**
 * @category Constructor
 * @since 0.13.1
 */
export const fromEither = FxT.fromNaturalTransformation<EI.URI, EE.URI>(EE.fromEither)

/**
 * @category Constructor
 * @since 0.13.1
 */
export const fromEnv = FxT.fromNaturalTransformation<E.URI, EE.URI>(EE.fromEnv)

/**
 * @category Constructor
 * @since 0.13.1
 */
export const fromIO = FxT.fromNaturalTransformation<IO.URI, EE.URI>(EE.fromIO)

/**
 * @category Combinator
 * @since 0.13.0
 */
export const useSome = FxT.useSome({ ...EE.UseSome, ...EE.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const useAll = FxT.useAll({ ...EE.UseAll, ...EE.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const provideSome = FxT.provideSome({ ...EE.ProvideSome, ...EE.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const provideAll = FxT.provideAll({ ...EE.ProvideAll, ...EE.MonadRec })
/**
 * @category Interpreter
 * @since 0.13.0
 */
export const Do = flow(doEnvEither, toEnvEither)

/**
 * @category URI
 * @since 0.13.0
 */
export const URI = '@typed/fp/Fx/EnvEither'
/**
 * @category URI
 * @since 0.13.0
 */
export type URI = typeof URI

/**
 * @category Model
 * @since 0.13.0
 */
export interface FxEnvEither<R, E, A> extends Fx<EE.EnvEither<R, E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: FxEnvEither<R, E, A>
  }
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Pointed: Pointed3<URI> = {
  of,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Functor: Functor3<URI> = {
  map,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Chain: Chain3<URI> = {
  ...Functor,
  chain,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const UseSome: P.UseSome3<URI> = {
  useSome,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const UseAll: P.UseAll3<URI> = {
  useAll,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ProvideSome: P.ProvideSome3<URI> = {
  provideSome,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ProvideAll: P.ProvideAll3<URI> = {
  provideAll,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Provide: P.Provide3<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

/**
 * @since 0.13.1
 * @category Constructor
 */
export const fromOption = <E>(lazy: Lazy<E>) => flow(EE.fromOption(lazy), liftEnvEither)

/**
 * @since 0.13.0
 * @category Constructor
 */
export const fromReader = flow(EE.fromReader, liftEnvEither)

/**
 * @since 0.13.0
 * @category Instance
 */
export const FromReader: FromReader3<URI> = {
  fromReader,
}

/**
 * @since 0.13.0
 * @category Combinator
 */
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })

/**
 * @since 0.13.0
 * @category Combinator
 */
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })

/**
 * @since 0.13.0
 * @category Combinator
 */
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })

/**
 * @since 0.13.0
 * @category Combinator
 */
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

/**
 * @since 0.13.0
 * @category Combinator
 */
export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })

/**
 * @since 0.13.0
 * @category Combinator
 */
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })
