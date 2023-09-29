/**
 * @effect/typeclass instances
 * @since 1.18.0
 */
import type { Either } from "effect/Either"
import { dual } from "effect/Function"
import type * as HKT from "effect/HKT"
import { getLeft, getRight } from "effect/Option"
import type * as Alt from "@effect/typeclass/Alternative"
import type * as App from "@effect/typeclass/Applicative"
import type * as BiCov from "@effect/typeclass/Bicovariant"
import type * as Ch from "@effect/typeclass/Chainable"
import type * as CP from "@effect/typeclass/Coproduct"
import * as COV from "@effect/typeclass/Covariant"
import type * as Filter from "@effect/typeclass/Filterable"
import type * as F from "@effect/typeclass/FlatMap"
import type * as I from "@effect/typeclass/Invariant"
import type * as M from "@effect/typeclass/Monad"
import type * as O from "@effect/typeclass/Of"
import type * as Point from "@effect/typeclass/Pointed"
import type * as P from "@effect/typeclass/Product"
import type * as SAlt from "@effect/typeclass/SemiAlternative"
import type * as SApp from "@effect/typeclass/SemiApplicative"
import type * as SCP from "@effect/typeclass/SemiCoproduct"
import type * as SP from "@effect/typeclass/SemiProduct"
import type { Fx } from "@typed/fx/Fx"

import * as core from "@typed/fx/internal/core"
import { multicast } from "@typed/fx/internal/share"

/**
 * TypeLambda for an Fx
 * @since 1.18.0
 * @category TypeLambda
 */
export interface FxTypeLambda extends HKT.TypeLambda {
  readonly type: Fx<this["Out2"], this["Out1"], this["Target"]>
}

/**
 * Of instance for Fx
 * @since 1.18.0
 * @category Of
 */
export const Of: O.Of<FxTypeLambda> = {
  of: core.succeed
}

/**
 * Invariant instance for Fx
 * @since 1.18.0
 * @category Invariant
 */
export const Invariant: I.Invariant<FxTypeLambda> = {
  imap: COV.imap<FxTypeLambda>(core.map)
}

/**
 * Covariant instance for Fx
 * @since 1.18.0
 * @category Covariant
 */
export const Covariant: COV.Covariant<FxTypeLambda> = {
  imap: Invariant.imap,
  map: core.map
}

/**
 * Pointed instance for Fx
 * @since 1.18.0
 * @category Pointed
 */
export const Pointed: Point.Pointed<FxTypeLambda> = {
  ...Of,
  ...Covariant
}

/**
 * Bicovariant instance for Fx
 * @since 1.18.0
 * @category Bicovariant
 */
export const Bicovariant: BiCov.Bicovariant<FxTypeLambda> = {
  bimap: dual(3, (self, f, g) => core.mapBoth(self, { onFailure: f, onSuccess: g }))
}

/**
 * SemiCoproduct instance for Fx which uses concatenation to join Fx together.
 * @since 1.18.0
 * @category SemiCoproduct
 */
export const SemiCoproductConcat: SCP.SemiCoproduct<FxTypeLambda> = {
  imap: Invariant.imap,
  coproduct: (self, that) => core.continueWith(self, () => that),
  coproductMany: (self, collection) => core.mergeSwitch([self, ...collection])
}

/**
 * SemiCoproduct instance for Fx which uses merging to join Fx together.
 * @since 1.18.0
 * @category SemiCoproduct
 */
export const SemiCoproductMerge: SCP.SemiCoproduct<FxTypeLambda> = {
  imap: Invariant.imap,
  coproduct: (self, that) => core.merge([self, that]),
  coproductMany: (self, collection) => core.merge([self, ...collection])
}

/**
 * SemiCoproduct instance for Fx which uses racing to join Fx together.
 * @since 1.18.0
 * @category SemiCoproduct
 */
export const SemiCoproductRace: SCP.SemiCoproduct<FxTypeLambda> = {
  imap: Invariant.imap,
  coproduct: (self, that) => core.race([self, that]),
  coproductMany: (self, collection) => core.race([self, ...collection])
}

/**
 * SemiCoproduct instances for Fx.
 * @since 1.18.0
 * @category SemiCoproduct
 */
export const SemiCoproduct: {
  readonly concat: SCP.SemiCoproduct<FxTypeLambda>
  readonly merge: SCP.SemiCoproduct<FxTypeLambda>
  readonly race: SCP.SemiCoproduct<FxTypeLambda>
} = {
  concat: SemiCoproductConcat,
  merge: SemiCoproductMerge,
  race: SemiCoproductRace
} as const

/**
 * SemiAlternative instance for Fx which uses concatenation to join Fx together.
 * @since 1.18.0
 * @category SemiAlternative
 */
export const SemiAlternativeConcat: SAlt.SemiAlternative<FxTypeLambda> = {
  ...Covariant,
  ...SemiCoproductConcat
}

/**
 * SemiAlternative instance for Fx which uses merging to join Fx together.
 * @since 1.18.0
 * @category SemiAlternative
 */
export const SemiAlternativeMerge: SAlt.SemiAlternative<FxTypeLambda> = {
  ...Covariant,
  ...SemiCoproductMerge
}

/**
 * SemiAlternative instance for Fx which uses racing to join Fx together.
 * @since 1.18.0
 * @category SemiAlternative
 */
export const SemiAlternativeRace: SAlt.SemiAlternative<FxTypeLambda> = {
  ...Covariant,
  ...SemiCoproductRace
}

/**
 * SemiAlternative instances for Fx.
 * @since 1.18.0
 * @category SemiAlternative
 */
export const SemiAlternative: {
  readonly concat: SAlt.SemiAlternative<FxTypeLambda>
  readonly merge: SAlt.SemiAlternative<FxTypeLambda>
  readonly race: SAlt.SemiAlternative<FxTypeLambda>
} = {
  concat: SemiAlternativeConcat,
  merge: SemiAlternativeMerge,
  race: SemiAlternativeRace
} as const

/**
 * Coproduct instance for Fx which uses concatenation to join Fx together.
 * @since 1.18.0
 * @category Coproduct
 */
export const CoproductConcat: CP.Coproduct<FxTypeLambda> = {
  ...SemiCoproductConcat,
  zero: () => core.empty,
  coproductAll: (collection) => core.mergeSwitch(Array.from(collection))
}

/**
 * Coproduct instance for Fx which uses merging to join Fx together.
 * @since 1.18.0
 * @category Coproduct
 */
export const CoproductMerge: CP.Coproduct<FxTypeLambda> = {
  ...SemiCoproductMerge,
  zero: () => core.empty,
  coproductAll: (collection) => core.merge(Array.from(collection))
}

/**
 * Coproduct instance for Fx which uses racing to join Fx together.
 * @since 1.18.0
 * @category Coproduct
 */
export const CoproductRace: CP.Coproduct<FxTypeLambda> = {
  ...SemiCoproductRace,
  zero: () => core.never,
  coproductAll: (collection) => core.race(Array.from(collection))
}

/**
 * Alternative instance for Fx which uses concatenation to join Fx together.
 * @since 1.18.0
 * @category Alternative
 */
export const AlternativeConcat: Alt.Alternative<FxTypeLambda> = {
  ...SemiAlternativeConcat,
  ...CoproductConcat
}

/**
 * Alternative instance for Fx which uses merging to join Fx together.
 * @since 1.18.0
 * @category Alternative
 */
export const AlternativeMerge: Alt.Alternative<FxTypeLambda> = {
  ...SemiAlternativeMerge,
  ...CoproductMerge
}

/**
 * Alternative instance for Fx which uses racing to join Fx together.
 * @since 1.18.0
 * @category Alternative
 */
export const AlternativeRace: Alt.Alternative<FxTypeLambda> = {
  ...SemiAlternativeRace,
  ...CoproductRace
}

/**
 * Alternative instances for Fx.
 * @since 1.18.0
 * @category Alternative
 */
export const Alternative: {
  readonly concat: Alt.Alternative<FxTypeLambda>
  readonly merge: Alt.Alternative<FxTypeLambda>
  readonly race: Alt.Alternative<FxTypeLambda>
} = {
  concat: AlternativeConcat,
  merge: AlternativeMerge,
  race: AlternativeRace
} as const

/**
 * SemiProduct instance for Fx
 * @since 1.18.0
 * @category SemiProduct
 */
export const Semiproduct: SP.SemiProduct<FxTypeLambda> = {
  imap: Invariant.imap,
  product: (self, that) => core.combine([self, that]) as any,
  productMany: (self, collection) => core.combine([self, ...collection]) as any
}

/**
 * SemiAppliative instance for Fx
 * @since 1.18.0
 * @category SemiApplicative
 */
export const SemiApplicative: SApp.SemiApplicative<FxTypeLambda> = {
  ...Covariant,
  ...Semiproduct
}

/**
 * Product instance for Fx
 * @since 1.18.0
 * @category Product
 */
export const Product: P.Product<FxTypeLambda> = {
  ...Of,
  ...Semiproduct,
  productAll: (collection) => core.combine(Array.from(collection)) as any
}

/**
 * Applicative instance for Fx
 * @since 1.18.0
 * @category Applicative
 */
export const Applicative: App.Applicative<FxTypeLambda> = {
  ...SemiApplicative,
  ...Product
}

/**
 * Filterable instance for Fx
 * @since 1.18.0
 * @category Filterable
 */
export const Filterable: Filter.Filterable<FxTypeLambda> = {
  partitionMap: dual(2, <R, E, A, B, C>(self: Fx<R, E, A>, f: (a: A) => Either<B, C>) => {
    const m = multicast(core.map(self, f))

    return [
      core.filterMap(m, getLeft),
      core.filterMap(m, getRight)
    ] as const
  }),
  filterMap: core.filterMap
}

/**
 * FlatMap instance for Fx which uses unbounded concurrency
 * @since 1.18.0
 * @category FlatMap
 */
export const FlatMap: F.FlatMap<FxTypeLambda> = {
  flatMap: core.flatMap
}

/**
 * Monad instance for Fx which uses unbounded concurrency
 * @since 1.18.0
 * @category Chainable
 */
export const Chainable: Ch.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...FlatMap
}

/**
 * Monad instance for Fx which uses unbounded concurrency
 * @since 1.18.0
 * @category Monad
 */
export const Monad: M.Monad<FxTypeLambda> = {
  ...Applicative,
  ...Chainable
}

/**
 * FlatMap instance for Fx which uses bounded concurrency, favoring the latest inner Fx.
 * @since 1.18.0
 * @category FlatMap
 */
export const SwitchMap: F.FlatMap<FxTypeLambda> = {
  flatMap: core.switchMap
}

/**
 * Chainable instance for Fx which uses bounded concurrency, favoring the latest inner Fx.
 * @since 1.18.0
 * @category Chainable
 */
export const SwitchMapChainable: Ch.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...SwitchMap
}

/**
 * Monad instance for Fx which uses bounded concurrency, favoring the latest inner Fx.
 * @since 1.18.0
 * @category Monad
 */
export const SwitchMapMonad: M.Monad<FxTypeLambda> = {
  ...Applicative,
  ...SwitchMapChainable
}

/**
 * FlatMap instance for Fx which uses bounded concurrency, favoring the first inner Fx.
 * @since 1.18.0
 * @category FlatMap
 */
export const ExhaustMap: F.FlatMap<FxTypeLambda> = {
  flatMap: core.exhaustMap
}

/**
 * Chainable instance for Fx which uses bounded concurrency, favoring the first inner Fx.
 * @since 1.18.0
 * @category Chainable
 */
export const ExhaustMapChainable: Ch.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...ExhaustMap
}

/**
 * Monad instance for Fx which uses bounded concurrency, favoring the first inner Fx.
 * @since 1.18.0
 * @category Monad
 */
export const ExhaustMapMonad: M.Monad<FxTypeLambda> = {
  ...Applicative,
  ...ExhaustMapChainable
}

/**
 * FlatMap instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.
 * @since 1.18.0
 * @category FlatMap
 */
export const ExhaustMapLatest: F.FlatMap<FxTypeLambda> = {
  flatMap: core.exhaustMapLatest
}

/**
 * Chainable instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.
 * @since 1.18.0
 * @category Chainable
 */
export const ExhaustMapLatestChainable: Ch.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...ExhaustMapLatest
}

/**
 * Monad instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.
 * @since 1.18.0
 * @category Monad
 */
export const ExhaustMapLatestMonad: M.Monad<FxTypeLambda> = {
  ...Applicative,
  ...ExhaustMapLatestChainable
}

/**
 * FlatMap instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.
 * @since 1.18.0
 * @category FlatMap
 */
export const ConcatMap: F.FlatMap<FxTypeLambda> = {
  flatMap: core.concatMap
}

/**
 * Chainable instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.
 * @since 1.18.0
 * @category Chainable
 */
export const ConcatMapChainable: Ch.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...ConcatMap
}

/**
 * Monad instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.
 * @since 1.18.0
 * @category Monad
 */
export const ConcatMapMonad: M.Monad<FxTypeLambda> = {
  ...Applicative,
  ...ConcatMapChainable
}
