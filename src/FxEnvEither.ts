/**
 * @typed/fp/FxEnvEither is a generator-based do-notation for EnvEither.
 *
 * @since 0.13.0
 */
import { Applicative3 } from 'fp-ts/Applicative'
import { Apply3 } from 'fp-ts/Apply'
import { Chain3 } from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import { FromReader3 } from 'fp-ts/FromReader'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import * as E from './EnvEither'
import { flow } from './function'
import { Fx } from './Fx'
import * as FxT from './FxT'
import * as P from './Provide'
import * as R from './Reader'

/**
 * @category Constructor
 * @since 0.13.0
 */
export const of = FxT.of(E.Pointed)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const chain = FxT.chain<E.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const chainRec = FxT.chainRec(E.MonadRec)
/**
 * @category Do
 * @since 0.13.0
 */
export const doEnvEither = FxT.getDo<E.URI>()
/**
 * @category Constructor
 * @since 0.13.0
 */
export const liftEnvEither = FxT.liftFx<E.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const map = FxT.map<E.URI>()
/**
 * @category Interpreter
 * @since 0.13.0
 */
export const toEnvEither = FxT.toMonad<E.URI>(E.MonadRec)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const ask = FxT.ask(E.FromReader)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const asks = FxT.fromNaturalTransformation<R.URI, E.URI>(E.fromReader)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
/**
 * @category Combinator
 * @since 0.13.0
 */
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
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
export interface FxEnvEither<R, E, A> extends Fx<E.EnvEither<R, E, unknown>, A> {}

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
 * @since 0.13.0
 * @category Constructor
 */
export const fromReader = flow(E.fromReader, liftEnvEither)

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
