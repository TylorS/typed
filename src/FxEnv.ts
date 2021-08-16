/**
 * @typed/fp/FxEnv is a generator-based do-notation for Env.
 *
 * @since 0.13.0
 */
import { Applicative2 } from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { FromReader2 } from 'fp-ts/FromReader'
import * as F from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as R from 'fp-ts/Reader'
import * as T from 'fp-ts/Task'

import * as E from './Env'
import { flow } from './function'
import { Fx } from './Fx'
import * as FxT from './FxT'
import * as P from './Provide'
import * as Re from './Resume'

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
 * @category Combinator
 * @since 0.13.0
 */
export const doEnv = FxT.getDo<E.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const liftEnv = FxT.liftFx<E.URI>()
/**
 * @category Combinator
 * @since 0.13.0
 */
export const map = FxT.map<E.URI>()
/**
 * @category Interpreter
 * @since 0.13.0
 */
export const toEnv = FxT.toMonad<E.URI>(E.MonadRec) as <Y extends E.Env<any, any>, R>(
  fx: Fx<Y, R, unknown>,
) => [Y] extends [E.Env<infer E, any>] ? E.Env<E, R> : never
/**
 * @category Interpreter
 * @since 0.13.0
 */
export const Do = flow(doEnv, toEnv)

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
 * @category Constructor
 * @since 0.13.0
 */
export const fromIO = FxT.fromNaturalTransformation<IO.URI, E.URI>(E.fromIO)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const fromResume = FxT.fromNaturalTransformation<Re.URI, E.URI>(E.fromResume)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const fromTask = FxT.fromNaturalTransformation<T.URI, E.URI>(E.fromTask)
/**
 * @category ConstructorfromReader
 * @since 0.13.0
 */
export const asks = FxT.fromNaturalTransformation<R.URI, E.URI>(E.fromReader)
/**
 * @category Constructor
 * @since 0.13.0
 */
export const ask = FxT.ask(E.FromReader)

/**
 * @category URI
 * @since 0.13.0
 */
export const URI = '@typed/fp/Fx/Env'
/**
 * @category URI
 * @since 0.13.0
 */
export type URI = typeof URI

/**
 * @category Model
 * @since 0.13.0
 */
export interface FxEnv<E, A> extends Fx<E.Env<E, unknown>, A> {}

/**
 * @category Type-level
 * @since 0.13.0
 */
export type GetRequirements<A> = A extends FxEnv<infer E, any> ? E : never

/**
 * @category Type-level
 * @since 0.13.0
 */
export type GetValue<A> = A extends FxEnv<any, infer R> ? R : never

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxEnv<E, A>
  }
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Pointed: Pointed2<URI> = {
  of,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Functor: F.Functor2<URI> = {
  map,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Apply: Ap.Apply2<URI> = {
  ...Functor,
  ap,
}

/**
 * @category Combinator
 * @since 0.13.0
 */
export const apFirst = Ap.apFirst(Apply)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const apFirstW = apFirst as <E1, B>(
  second: FxEnv<E1, B>,
) => <E2, A>(first: FxEnv<E2, A>) => FxEnv<E1 & E2, A>

/**
 * @category Combinator
 * @since 0.13.0
 */
export const apS = Ap.apS(Apply)

/**
 * @category Combinator
 * @since 0.13.0
 */
export const apSW = apS as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: FxEnv<E1, B>,
) => <E2>(
  fa: FxEnv<E2, A>,
) => FxEnv<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @category Combinator
 * @since 0.13.0
 */
export const apSecond = Ap.apSecond(Apply)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const apSecondW = apSecond as <E1, B>(
  second: FxEnv<E1, B>,
) => <E2, A>(first: FxEnv<E2, A>) => FxEnv<E1 & E2, A>
/**
 * @category Combinator
 * @since 0.13.0
 */
export const apT = Ap.apT(Apply)
/**
 * @category Combinator
 * @since 0.13.0
 */
export const apTW = apT as <E1, B>(
  fb: FxEnv<E1, B>,
) => <E2, A extends readonly unknown[]>(fas: FxEnv<E2, A>) => FxEnv<E1 & E2, readonly [...A, B]>

/**
 * @category Combinator
 * @since 0.13.0
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @category Instance
 * @since 0.13.0
 */
export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Chain: Ch.Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @category Combinator
 * @since 0.13.0
 */
export const bind = Ch.bind(Chain)

/**
 * @category Combinator
 * @since 0.13.0
 */
export const chainFirst = Ch.chainFirst(Chain)

/**
 * @category Instance
 * @since 0.13.0
 */
export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const UseSome: P.UseSome2<URI> = {
  useSome,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const UseAll: P.UseAll2<URI> = {
  useAll,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

/**
 * @category Instance
 * @since 0.13.0
 */
export const Provide: P.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

/**
 * @since 0.13.0
 * @category Constructor
 */
export const fromReader = flow(E.fromReader, liftEnv)

/**
 * @category Instance
 * @since 0.13.0
 */
export const FromReader: FromReader2<URI> = {
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
