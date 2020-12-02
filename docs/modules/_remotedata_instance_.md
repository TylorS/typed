**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/instance"

# Module: "RemoteData/instance"

## Index

### Modules

* ["HKT"](_remotedata_instance_._hkt_.md)

### Type aliases

* [URI](_remotedata_instance_.md#uri)

### Variables

* [URI](_remotedata_instance_.md#uri)
* [alt](_remotedata_instance_.md#alt)
* [apFirst](_remotedata_instance_.md#apfirst)
* [apSecond](_remotedata_instance_.md#apsecond)
* [bimap](_remotedata_instance_.md#bimap)
* [chainFirst](_remotedata_instance_.md#chainfirst)
* [duplicate](_remotedata_instance_.md#duplicate)
* [extend](_remotedata_instance_.md#extend)
* [flatten](_remotedata_instance_.md#flatten)
* [foldMap](_remotedata_instance_.md#foldmap)
* [reduce](_remotedata_instance_.md#reduce)
* [reduceRight](_remotedata_instance_.md#reduceright)

### Object literals

* [remoteData](_remotedata_instance_.md#remotedata)

## Type aliases

### URI

Ƭ  **URI**: *typeof* [URI](_remotedata_instance_.md#uri)

*Defined in [src/RemoteData/instance.ts:25](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L25)*

## Variables

### URI

• `Const` **URI**: \"@typed/fp/RemoteData/exports\" = "@typed/fp/RemoteData/exports"

*Defined in [src/RemoteData/instance.ts:24](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L24)*

___

### alt

•  **alt**: \<E, A>(that: Lazy\<Kind2\<F, E, A>>) => (fa: Kind2\<F, E, A>) => Kind2\<F, E, A>

*Defined in [src/RemoteData/instance.ts:106](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L106)*

___

### apFirst

•  **apFirst**: \<E, B>(fb: Kind2\<F, E, B>) => \<A>(fa: Kind2\<F, E, A>) => Kind2\<F, E, A>

*Defined in [src/RemoteData/instance.ts:107](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L107)*

___

### apSecond

•  **apSecond**: \<E, B>(fb: Kind2\<F, E, B>) => \<A>(fa: Kind2\<F, E, A>) => Kind2\<F, E, B>

*Defined in [src/RemoteData/instance.ts:108](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L108)*

___

### bimap

•  **bimap**: \<E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => (fa: Kind2\<F, E, A>) => Kind2\<F, G, B>

*Defined in [src/RemoteData/instance.ts:109](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L109)*

___

### chainFirst

•  **chainFirst**: \<E, A, B>(f: (a: A) => Kind2\<F, E, B>) => (ma: Kind2\<F, E, A>) => Kind2\<F, E, A>

*Defined in [src/RemoteData/instance.ts:110](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L110)*

___

### duplicate

•  **duplicate**: \<E, A>(wa: Kind2\<F, E, A>) => Kind2\<F, E, Kind2\<F, E, A>>

*Defined in [src/RemoteData/instance.ts:111](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L111)*

___

### extend

•  **extend**: \<E, A, B>(f: (wa: Kind2\<F, E, A>) => B) => (wa: Kind2\<F, E, A>) => Kind2\<F, E, B>

*Defined in [src/RemoteData/instance.ts:112](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L112)*

___

### flatten

•  **flatten**: \<E, A>(mma: Kind2\<F, E, Kind2\<F, E, A>>) => Kind2\<F, E, A>

*Defined in [src/RemoteData/instance.ts:113](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L113)*

___

### foldMap

•  **foldMap**: \<M>(M: Monoid\<M>) => \<A>(f: (a: A) => M) => \<E>(fa: Kind2\<F, E, A>) => M

*Defined in [src/RemoteData/instance.ts:114](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L114)*

___

### reduce

•  **reduce**: \<A, B>(b: B, f: (b: B, a: A) => B) => \<E>(fa: Kind2\<F, E, A>) => B

*Defined in [src/RemoteData/instance.ts:115](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L115)*

___

### reduceRight

•  **reduceRight**: \<A, B>(b: B, f: (a: A, b: B) => B) => \<E>(fa: Kind2\<F, E, A>) => B

*Defined in [src/RemoteData/instance.ts:116](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L116)*

## Object literals

### remoteData

▪ `Const` **remoteData**: object

*Defined in [src/RemoteData/instance.ts:36](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/instance.ts#L36)*

Monad, Foldable, Traverasble, Alt, Extend and Alternative instances for RemoteData.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@typed/fp/RemoteData/exports\" | \"@typed/fp/RemoteData/exports\" |
`ap` | function | ap |
`of` | of | Success.of |
`alt` | function | (fa: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: Lazy\<[RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A> |
`bimap` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: (e: E) => G, g: (a: A) => B) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<G, B> |
`chain` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: (a: A) => Kind2\<F, E, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, B> |
`extend` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: (wa: Kind2\<W, E, A>) => B) => [NoData](../enums/_remotedata_enums_.remotedatastatus.md#nodata) \| [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading) \| [Failure](_remotedata_failure_.failure.md)\<E> \| [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<E> \| [Success](_remotedata_success_.success.md)\<B> |
`foldMap` | function | \<M>(M: Monoid\<M>) => (Anonymous function) |
`map` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: (a: A) => B) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, B> |
`mapLeft` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, f: (e: E) => G) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<G, A> |
`reduce` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, b: B, f: (b: B, a: A) => B) => B |
`reduceRight` | function | (rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<E, A>, b: B, f: (a: A, b: B) => B) => B |
`sequence` | function | \<F>(F: Applicative\<F>) => (Anonymous function) |
`traverse` | function | \<F>(F: Applicative\<F>) => (Anonymous function) |
`zero` | function | \<A, B>() => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |
