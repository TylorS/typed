---
title: Typeclass.ts
nav_order: 5
parent: "@typed/fx"
---

## Typeclass overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Alternative](#alternative)
  - [AlternativeConcat](#alternativeconcat)
  - [AlternativeMerge](#alternativemerge)
  - [AlternativeRace](#alternativerace)
  - [Applicative](#applicative)
  - [Bicovariant](#bicovariant)
  - [Chainable](#chainable)
  - [ConcatMap](#concatmap)
  - [ConcatMapChainable](#concatmapchainable)
  - [ConcatMapMonad](#concatmapmonad)
  - [CoproductConcat](#coproductconcat)
  - [CoproductMerge](#coproductmerge)
  - [CoproductRace](#coproductrace)
  - [Covariant](#covariant)
  - [ExhaustMap](#exhaustmap)
  - [ExhaustMapChainable](#exhaustmapchainable)
  - [ExhaustMapLatest](#exhaustmaplatest)
  - [ExhaustMapLatestChainable](#exhaustmaplatestchainable)
  - [ExhaustMapLatestMonad](#exhaustmaplatestmonad)
  - [ExhaustMapMonad](#exhaustmapmonad)
  - [Filterable](#filterable)
  - [FlatMap](#flatmap)
  - [FxTypeLambda (interface)](#fxtypelambda-interface)
  - [Invariant](#invariant)
  - [Monad](#monad)
  - [Of](#of)
  - [Pointed](#pointed)
  - [Product](#product)
  - [SemiAlternative](#semialternative)
  - [SemiAlternativeConcat](#semialternativeconcat)
  - [SemiAlternativeMerge](#semialternativemerge)
  - [SemiAlternativeRace](#semialternativerace)
  - [SemiApplicative](#semiapplicative)
  - [SemiCoproduct](#semicoproduct)
  - [SemiCoproductConcat](#semicoproductconcat)
  - [SemiCoproductMerge](#semicoproductmerge)
  - [SemiCoproductRace](#semicoproductrace)
  - [Semiproduct](#semiproduct)
  - [SwitchMap](#switchmap)
  - [SwitchMapChainable](#switchmapchainable)
  - [SwitchMapMonad](#switchmapmonad)

---

# utils

## Alternative

Alternative instances for Fx.

**Signature**

```ts
export declare const Alternative: {
  readonly concat: Alt.Alternative<FxTypeLambda>
  readonly merge: Alt.Alternative<FxTypeLambda>
  readonly race: Alt.Alternative<FxTypeLambda>
}
```

Added in v1.18.0

## AlternativeConcat

Alternative instance for Fx which uses concatenation to join Fx together.

**Signature**

```ts
export declare const AlternativeConcat: Alt.Alternative<FxTypeLambda>
```

Added in v1.18.0

## AlternativeMerge

Alternative instance for Fx which uses merging to join Fx together.

**Signature**

```ts
export declare const AlternativeMerge: Alt.Alternative<FxTypeLambda>
```

Added in v1.18.0

## AlternativeRace

Alternative instance for Fx which uses racing to join Fx together.

**Signature**

```ts
export declare const AlternativeRace: Alt.Alternative<FxTypeLambda>
```

Added in v1.18.0

## Applicative

Applicative instance for Fx

**Signature**

```ts
export declare const Applicative: App.Applicative<FxTypeLambda>
```

Added in v1.18.0

## Bicovariant

Bicovariant instance for Fx

**Signature**

```ts
export declare const Bicovariant: BiCov.Bicovariant<FxTypeLambda>
```

Added in v1.18.0

## Chainable

Monad instance for Fx which uses unbounded concurrency

**Signature**

```ts
export declare const Chainable: Ch.Chainable<FxTypeLambda>
```

Added in v1.18.0

## ConcatMap

FlatMap instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.

**Signature**

```ts
export declare const ConcatMap: F.FlatMap<FxTypeLambda>
```

Added in v1.18.0

## ConcatMapChainable

Chainable instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.

**Signature**

```ts
export declare const ConcatMapChainable: Ch.Chainable<FxTypeLambda>
```

Added in v1.18.0

## ConcatMapMonad

Monad instance for Fx which uses bounded concurrency, concatenating inner Fx on after another.

**Signature**

```ts
export declare const ConcatMapMonad: M.Monad<FxTypeLambda>
```

Added in v1.18.0

## CoproductConcat

Coproduct instance for Fx which uses concatenation to join Fx together.

**Signature**

```ts
export declare const CoproductConcat: CP.Coproduct<FxTypeLambda>
```

Added in v1.18.0

## CoproductMerge

Coproduct instance for Fx which uses merging to join Fx together.

**Signature**

```ts
export declare const CoproductMerge: CP.Coproduct<FxTypeLambda>
```

Added in v1.18.0

## CoproductRace

Coproduct instance for Fx which uses racing to join Fx together.

**Signature**

```ts
export declare const CoproductRace: CP.Coproduct<FxTypeLambda>
```

Added in v1.18.0

## Covariant

Covariant instance for Fx

**Signature**

```ts
export declare const Covariant: COV.Covariant<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMap

FlatMap instance for Fx which uses bounded concurrency, favoring the first inner Fx.

**Signature**

```ts
export declare const ExhaustMap: F.FlatMap<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMapChainable

Chainable instance for Fx which uses bounded concurrency, favoring the first inner Fx.

**Signature**

```ts
export declare const ExhaustMapChainable: Ch.Chainable<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMapLatest

FlatMap instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.

**Signature**

```ts
export declare const ExhaustMapLatest: F.FlatMap<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMapLatestChainable

Chainable instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.

**Signature**

```ts
export declare const ExhaustMapLatestChainable: Ch.Chainable<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMapLatestMonad

Monad instance for Fx which uses bounded concurrency, favoring the first and latest inner Fx.

**Signature**

```ts
export declare const ExhaustMapLatestMonad: M.Monad<FxTypeLambda>
```

Added in v1.18.0

## ExhaustMapMonad

Monad instance for Fx which uses bounded concurrency, favoring the first inner Fx.

**Signature**

```ts
export declare const ExhaustMapMonad: M.Monad<FxTypeLambda>
```

Added in v1.18.0

## Filterable

Filterable instance for Fx

**Signature**

```ts
export declare const Filterable: Filter.Filterable<FxTypeLambda>
```

Added in v1.18.0

## FlatMap

FlatMap instance for Fx which uses unbounded concurrency

**Signature**

```ts
export declare const FlatMap: F.FlatMap<FxTypeLambda>
```

Added in v1.18.0

## FxTypeLambda (interface)

TypeLambda for an Fx

**Signature**

```ts
export interface FxTypeLambda extends HKT.TypeLambda {
  readonly type: Fx<this['Out2'], this['Out1'], this['Target']>
}
```

Added in v1.18.0

## Invariant

Invariant instance for Fx

**Signature**

```ts
export declare const Invariant: I.Invariant<FxTypeLambda>
```

Added in v1.18.0

## Monad

Monad instance for Fx which uses unbounded concurrency

**Signature**

```ts
export declare const Monad: M.Monad<FxTypeLambda>
```

Added in v1.18.0

## Of

Of instance for Fx

**Signature**

```ts
export declare const Of: O.Of<FxTypeLambda>
```

Added in v1.18.0

## Pointed

Pointed instance for Fx

**Signature**

```ts
export declare const Pointed: Point.Pointed<FxTypeLambda>
```

Added in v1.18.0

## Product

Product instance for Fx

**Signature**

```ts
export declare const Product: P.Product<FxTypeLambda>
```

Added in v1.18.0

## SemiAlternative

SemiAlternative instances for Fx.

**Signature**

```ts
export declare const SemiAlternative: {
  readonly concat: SAlt.SemiAlternative<FxTypeLambda>
  readonly merge: SAlt.SemiAlternative<FxTypeLambda>
  readonly race: SAlt.SemiAlternative<FxTypeLambda>
}
```

Added in v1.18.0

## SemiAlternativeConcat

SemiAlternative instance for Fx which uses concatenation to join Fx together.

**Signature**

```ts
export declare const SemiAlternativeConcat: SAlt.SemiAlternative<FxTypeLambda>
```

Added in v1.18.0

## SemiAlternativeMerge

SemiAlternative instance for Fx which uses merging to join Fx together.

**Signature**

```ts
export declare const SemiAlternativeMerge: SAlt.SemiAlternative<FxTypeLambda>
```

Added in v1.18.0

## SemiAlternativeRace

SemiAlternative instance for Fx which uses racing to join Fx together.

**Signature**

```ts
export declare const SemiAlternativeRace: SAlt.SemiAlternative<FxTypeLambda>
```

Added in v1.18.0

## SemiApplicative

SemiAppliative instance for Fx

**Signature**

```ts
export declare const SemiApplicative: SApp.SemiApplicative<FxTypeLambda>
```

Added in v1.18.0

## SemiCoproduct

SemiCoproduct instances for Fx.

**Signature**

```ts
export declare const SemiCoproduct: {
  readonly concat: SCP.SemiCoproduct<FxTypeLambda>
  readonly merge: SCP.SemiCoproduct<FxTypeLambda>
  readonly race: SCP.SemiCoproduct<FxTypeLambda>
}
```

Added in v1.18.0

## SemiCoproductConcat

SemiCoproduct instance for Fx which uses concatenation to join Fx together.

**Signature**

```ts
export declare const SemiCoproductConcat: SCP.SemiCoproduct<FxTypeLambda>
```

Added in v1.18.0

## SemiCoproductMerge

SemiCoproduct instance for Fx which uses merging to join Fx together.

**Signature**

```ts
export declare const SemiCoproductMerge: SCP.SemiCoproduct<FxTypeLambda>
```

Added in v1.18.0

## SemiCoproductRace

SemiCoproduct instance for Fx which uses racing to join Fx together.

**Signature**

```ts
export declare const SemiCoproductRace: SCP.SemiCoproduct<FxTypeLambda>
```

Added in v1.18.0

## Semiproduct

SemiProduct instance for Fx

**Signature**

```ts
export declare const Semiproduct: SP.SemiProduct<FxTypeLambda>
```

Added in v1.18.0

## SwitchMap

FlatMap instance for Fx which uses bounded concurrency, favoring the latest inner Fx.

**Signature**

```ts
export declare const SwitchMap: F.FlatMap<FxTypeLambda>
```

Added in v1.18.0

## SwitchMapChainable

Chainable instance for Fx which uses bounded concurrency, favoring the latest inner Fx.

**Signature**

```ts
export declare const SwitchMapChainable: Ch.Chainable<FxTypeLambda>
```

Added in v1.18.0

## SwitchMapMonad

Monad instance for Fx which uses bounded concurrency, favoring the latest inner Fx.

**Signature**

```ts
export declare const SwitchMapMonad: M.Monad<FxTypeLambda>
```

Added in v1.18.0
