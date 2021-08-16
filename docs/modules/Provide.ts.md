---
title: Provide.ts
nav_order: 40
parent: Modules
---

## Provide overview

Provide is a Typeclass to represent the ability to add/remove requirements from Reader-like effects
such as [Env](./Env.ts.md) or [ReaderStream](./ReaderStream.ts.md).

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [provideAllWith](#provideallwith)
  - [provideSomeWith](#providesomewith)
  - [useAllWith](#useallwith)
  - [useSomeWith](#usesomewith)
- [Type-level](#type-level)
  - [Provider (type alias)](#provider-type-alias)
  - [Provider2 (type alias)](#provider2-type-alias)
  - [Provider3 (type alias)](#provider3-type-alias)
  - [Provider4 (type alias)](#provider4-type-alias)
- [Typeclass](#typeclass)
  - [Provide (interface)](#provide-interface)
  - [Provide2 (interface)](#provide2-interface)
  - [Provide3 (interface)](#provide3-interface)
  - [Provide3C (interface)](#provide3c-interface)
  - [Provide4 (interface)](#provide4-interface)
  - [ProvideAll (interface)](#provideall-interface)
  - [ProvideAll2 (interface)](#provideall2-interface)
  - [ProvideAll3 (interface)](#provideall3-interface)
  - [ProvideAll3C (interface)](#provideall3c-interface)
  - [ProvideAll4 (interface)](#provideall4-interface)
  - [ProvideSome (interface)](#providesome-interface)
  - [ProvideSome2 (interface)](#providesome2-interface)
  - [ProvideSome3 (interface)](#providesome3-interface)
  - [ProvideSome3C (interface)](#providesome3c-interface)
  - [ProvideSome4 (interface)](#providesome4-interface)
  - [UseAll (interface)](#useall-interface)
  - [UseAll2 (interface)](#useall2-interface)
  - [UseAll3 (interface)](#useall3-interface)
  - [UseAll3C (interface)](#useall3c-interface)
  - [UseAll4 (interface)](#useall4-interface)
  - [UseSome (interface)](#usesome-interface)
  - [UseSome2 (interface)](#usesome2-interface)
  - [UseSome3 (interface)](#usesome3-interface)
  - [UseSome3C (interface)](#usesome3c-interface)
  - [UseSome4 (interface)](#usesome4-interface)

---

# Combinator

## askAndProvide

**Signature**

```ts
export declare function askAndProvide<F extends URIS2>(
  M: ProvideAll2<F> & Chain2<F> & FromReader2<F>,
): <E, B>(hkt: Kind2<F, E, B>) => Kind2<F, E, Kind2<F, unknown, B>>
export declare function askAndProvide<F extends URIS3>(
  M: ProvideAll3<F> & Chain3<F> & FromReader3<F>,
): <R, E, B>(hkt: Kind3<F, R, E, B>) => Kind3<F, R, E, Kind3<F, unknown, E, B>>
export declare function askAndProvide<F extends URIS4>(
  M: ProvideAll4<F> & Chain4<F> & FromReader4<F>,
): <S, R, E, B>(hkt: Kind4<F, S, R, E, B>) => Kind4<F, S, R, E, Kind4<F, S, unknown, E, B>>
export declare function askAndProvide<F>(
  M: ProvideAll<F> & Chain<F> & FromReader<F>,
): <E, B>(hkt: HKT2<F, E, B>) => HKT2<F, E, HKT2<F, unknown, B>>
```

Added in v0.9.2

## askAndUse

**Signature**

```ts
export declare function askAndUse<F extends URIS2>(
  M: UseAll2<F> & Chain2<F> & FromReader2<F>,
): <E, B>(hkt: Kind2<F, E, B>) => Kind2<F, E, Kind2<F, unknown, B>>
export declare function askAndUse<F extends URIS3>(
  M: UseAll3<F> & Chain3<F> & FromReader3<F>,
): <R, E, B>(hkt: Kind3<F, R, E, B>) => Kind3<F, R, E, Kind3<F, unknown, E, B>>
export declare function askAndUse<F extends URIS4>(
  M: UseAll4<F> & Chain4<F> & FromReader4<F>,
): <S, R, E, B>(hkt: Kind4<F, S, R, E, B>) => Kind4<F, S, R, E, Kind4<F, S, unknown, E, B>>
export declare function askAndUse<F>(
  M: UseAll<F> & Chain<F> & FromReader<F>,
): <E, B>(hkt: HKT2<F, E, B>) => HKT2<F, E, HKT2<F, unknown, B>>
```

Added in v0.9.2

## provideAllWith

**Signature**

```ts
export declare function provideAllWith<F extends URIS2>(
  M: ProvideAll2<F> & Chain2<F>,
): <R, A>(provider: Hkt<F, [R, A]>) => <B>(hkt: Hkt<F, [A, B]>) => Hkt<F, [R, B]>
export declare function provideAllWith<F extends URIS3>(
  M: ProvideAll3<F> & Chain3<F>,
): <R, E1, A>(
  provider: Hkt<F, [R, E1, A]>,
) => <E2, B>(hkt: Hkt<F, [A, E2, B]>) => Hkt<F, [R, ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function provideAllWith<F extends URIS4>(
  M: ProvideAll4<F> & Chain4<F>,
): <S1, R, E1, A>(
  provider: Hkt<F, [S1, R, E1, A]>,
) => <S2, E2, B>(
  hkt: Hkt<F, [S2, A, E2, B]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, R, ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function provideAllWith<F>(
  M: ProvideAll<F> & Chain<F>,
): <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, R, B>
```

Added in v0.9.2

## provideSomeWith

**Signature**

```ts
export declare function provideSomeWith<F extends URIS2>(
  M: ProvideSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>
export declare function provideSomeWith<F extends URIS3>(
  M: ProvideSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>
export declare function provideSomeWith<F extends URIS4>(
  M: ProvideSome4<F> & Chain4<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>
export declare function provideSomeWith<F>(
  M: ProvideSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>
```

Added in v0.9.2

## useAllWith

**Signature**

```ts
export declare function useAllWith<F extends URIS2>(
  M: UseAll2<F> & Chain2<F>,
): <R, A>(provider: Hkt<F, [R, A]>) => <B>(hkt: Hkt<F, [A, B]>) => Hkt<F, [R, B]>
export declare function useAllWith<F extends URIS3>(
  M: UseAll3<F> & Chain3<F>,
): <R, E1, A>(
  provider: Hkt<F, [R, E1, A]>,
) => <E2, B>(hkt: Hkt<F, [A, E2, B]>) => Hkt<F, [R, ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function useAllWith<F extends URIS4>(
  M: UseAll4<F> & Chain4<F>,
): <S1, R, E1, A>(
  provider: Hkt<F, [S1, R, E1, A]>,
) => <S2, E2, B>(
  hkt: Hkt<F, [S2, A, E2, B]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, R, ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function useAllWith<F>(
  M: UseAll<F> & Chain<F>,
): <R, A>(provider: HKT2<F, R, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, R, B>
```

Added in v0.9.2

## useSomeWith

**Signature**

```ts
export declare function useSomeWith<F extends URIS2>(
  M: UseSome2<F> & Chain2<F>,
): <E1, A>(provider: Hkt<F, [E1, A]>) => Provider2<F, A, E1>
export declare function useSomeWith<F extends URIS3>(
  M: UseSome3<F> & Chain3<F>,
): <R1, E1, A>(provider: Hkt<F, [R1, E1, A]>) => Provider3<F, A, R1, E1>
export declare function useSomeWith<F extends URIS4>(
  M: UseSome4<F> & Chain4<F>,
): <S1, R1, E1, A>(provider: Hkt<F, [S1, R1, E1, A]>) => Provider4<F, A, R1, S1, E1>
export declare function useSomeWith<F>(
  M: UseSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, A, E1>
```

Added in v0.9.2

# Type-level

## Provider (type alias)

**Signature**

```ts
export type Provider<F, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>
```

Added in v0.9.2

## Provider2 (type alias)

**Signature**

```ts
export type Provider2<F extends URIS2, Removed, Added> = <E, A>(
  hkt: Hkt<F, [Removed & E, A]>,
) => Hkt<F, [Added & E, A]>
```

Added in v0.9.2

## Provider3 (type alias)

**Signature**

```ts
export type Provider3<F extends URIS3, Removed, Added, E1> = <R, E2, A>(
  hkt: Hkt<F, [Removed & R, E2, A]>,
) => Hkt<F, [Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>
```

Added in v0.9.2

## Provider4 (type alias)

**Signature**

```ts
export type Provider4<F extends URIS4, Removed, Added, S1, E1> = <S2, R, E2, A>(
  hkt: Hkt<F, [S2, Removed & R, E2, A]>,
) => Hkt<F, [ApplyVariance<F, 'S', [S1, S2]>, Added & R, ApplyVariance<F, 'E', [E1, E2]>, A]>
```

Added in v0.9.2

# Typeclass

## Provide (interface)

**Signature**

```ts
export interface Provide<F> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: HKT2<F, A & B, C>) => HKT2<F, B, C>
  readonly provideAll: <A>(provided: A) => <B>(hkt: HKT2<F, Partial<A>, B>) => HKT2<F, unknown, B>
  readonly useSome: Provide<F>['provideSome']
  readonly useAll: Provide<F>['provideAll']
}
```

Added in v0.9.2

## Provide2 (interface)

**Signature**

```ts
export interface Provide2<F extends URIS2> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, C]>) => Hkt<F, [B, C]>
  readonly provideAll: <A>(provided: A) => <B>(hkt: Hkt<F, [Partial<A>, B]>) => Hkt<F, [unknown, B]>
  readonly useSome: Provide2<F>['provideSome']
  readonly useAll: Provide2<F>['provideAll']
}
```

Added in v0.9.2

## Provide3 (interface)

**Signature**

```ts
export interface Provide3<F extends URIS3> {
  readonly provideSome: <A>(
    provided: A,
  ) => <B, E, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <E, B>(hkt: Hkt<F, [Partial<A>, E, B]>) => Hkt<F, [unknown, E, B]>
  readonly useSome: Provide3<F>['provideSome']
  readonly useAll: Provide3<F>['provideAll']
}
```

Added in v0.9.2

## Provide3C (interface)

**Signature**

```ts
export interface Provide3C<F extends URIS3, E> {
  readonly provideSome: <A>(provided: A) => <B, C>(hkt: Hkt<F, [A & B, E, C]>) => Hkt<F, [B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <B>(hkt: Hkt<F, [Partial<A>, E, B]>) => Hkt<F, [unknown, E, B]>
  readonly useSome: Provide3C<F, E>['provideSome']
  readonly useAll: Provide3C<F, E>['provideAll']
}
```

Added in v0.9.2

## Provide4 (interface)

**Signature**

```ts
export interface Provide4<F extends URIS4> {
  readonly provideSome: <A>(
    provided: A,
  ) => <S, B, E, C>(hkt: Hkt<F, [S, A & B, E, C]>) => Hkt<F, [S, B, E, C]>
  readonly provideAll: <A>(
    provided: A,
  ) => <S, E, B>(hkt: Hkt<F, [S, Partial<A>, E, B]>) => Hkt<F, [S, unknown, E, B]>
  readonly useSome: Provide4<F>['provideSome']
  readonly useAll: Provide4<F>['provideAll']
}
```

Added in v0.9.2

## ProvideAll (interface)

**Signature**

```ts
export interface ProvideAll<F> extends Pick<Provide<F>, 'provideAll'> {}
```

Added in v0.9.2

## ProvideAll2 (interface)

**Signature**

```ts
export interface ProvideAll2<F extends URIS2> extends Pick<Provide2<F>, 'provideAll'> {}
```

Added in v0.9.2

## ProvideAll3 (interface)

**Signature**

```ts
export interface ProvideAll3<F extends URIS3> extends Pick<Provide3<F>, 'provideAll'> {}
```

Added in v0.9.2

## ProvideAll3C (interface)

**Signature**

```ts
export interface ProvideAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideAll'> {}
```

Added in v0.9.2

## ProvideAll4 (interface)

**Signature**

```ts
export interface ProvideAll4<F extends URIS4> extends Pick<Provide4<F>, 'provideAll'> {}
```

Added in v0.9.2

## ProvideSome (interface)

**Signature**

```ts
export interface ProvideSome<F> extends Pick<Provide<F>, 'provideSome'> {}
```

Added in v0.9.2

## ProvideSome2 (interface)

**Signature**

```ts
export interface ProvideSome2<F extends URIS2> extends Pick<Provide2<F>, 'provideSome'> {}
```

Added in v0.9.2

## ProvideSome3 (interface)

**Signature**

```ts
export interface ProvideSome3<F extends URIS3> extends Pick<Provide3<F>, 'provideSome'> {}
```

Added in v0.9.2

## ProvideSome3C (interface)

**Signature**

```ts
export interface ProvideSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'provideSome'> {}
```

Added in v0.9.2

## ProvideSome4 (interface)

**Signature**

```ts
export interface ProvideSome4<F extends URIS4> extends Pick<Provide4<F>, 'provideSome'> {}
```

Added in v0.9.2

## UseAll (interface)

**Signature**

```ts
export interface UseAll<F> extends Pick<Provide<F>, 'useAll'> {}
```

Added in v0.9.2

## UseAll2 (interface)

**Signature**

```ts
export interface UseAll2<F extends URIS2> extends Pick<Provide2<F>, 'useAll'> {}
```

Added in v0.9.2

## UseAll3 (interface)

**Signature**

```ts
export interface UseAll3<F extends URIS3> extends Pick<Provide3<F>, 'useAll'> {}
```

Added in v0.9.2

## UseAll3C (interface)

**Signature**

```ts
export interface UseAll3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useAll'> {}
```

Added in v0.9.2

## UseAll4 (interface)

**Signature**

```ts
export interface UseAll4<F extends URIS4> extends Pick<Provide4<F>, 'useAll'> {}
```

Added in v0.9.2

## UseSome (interface)

**Signature**

```ts
export interface UseSome<F> extends Pick<Provide<F>, 'useSome'> {}
```

Added in v0.9.2

## UseSome2 (interface)

**Signature**

```ts
export interface UseSome2<F extends URIS2> extends Pick<Provide2<F>, 'useSome'> {}
```

Added in v0.9.2

## UseSome3 (interface)

**Signature**

```ts
export interface UseSome3<F extends URIS3> extends Pick<Provide3<F>, 'useSome'> {}
```

Added in v0.9.2

## UseSome3C (interface)

**Signature**

```ts
export interface UseSome3C<F extends URIS3, E> extends Pick<Provide3C<F, E>, 'useSome'> {}
```

Added in v0.9.2

## UseSome4 (interface)

**Signature**

```ts
export interface UseSome4<F extends URIS4> extends Pick<Provide4<F>, 'useSome'> {}
```

Added in v0.9.2
