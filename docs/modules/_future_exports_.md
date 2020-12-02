**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Future/exports"

# Module: "Future/exports"

## Index

### Modules

* ["HKT"](_future_exports_._hkt_.md)

### Type aliases

* [Future](_future_exports_.md#future)
* [URI](_future_exports_.md#uri)

### Variables

* [URI](_future_exports_.md#uri)
* [alt](_future_exports_.md#alt)
* [ap](_future_exports_.md#ap)
* [apFirst](_future_exports_.md#apfirst)
* [apSecond](_future_exports_.md#apsecond)
* [bimap](_future_exports_.md#bimap)
* [chain](_future_exports_.md#chain)
* [chainFirst](_future_exports_.md#chainfirst)
* [flatten](_future_exports_.md#flatten)
* [map](_future_exports_.md#map)
* [mapLeft](_future_exports_.md#mapleft)

### Functions

* [fromReaderTaskEither](_future_exports_.md#fromreadertaskeither)
* [left](_future_exports_.md#left)
* [orFail](_future_exports_.md#orfail)
* [right](_future_exports_.md#right)
* [toReaderTaskEither](_future_exports_.md#toreadertaskeither)

### Object literals

* [future](_future_exports_.md#future)
* [futureSeq](_future_exports_.md#futureseq)

## Type aliases

### Future

Ƭ  **Future**\<E, A, B>: [Effect](_effect_effect_.effect.md)\<E, Either\<A, B>>

*Defined in [src/Future/exports.ts:24](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L24)*

#### Type parameters:

Name |
------ |
`E` |
`A` |
`B` |

___

### URI

Ƭ  **URI**: *typeof* [URI](_future_exports_.md#uri)

*Defined in [src/Future/exports.ts:22](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L22)*

## Variables

### URI

• `Const` **URI**: \"@typed/fp/Future/exports\" = "@typed/fp/Future/exports"

*Defined in [src/Future/exports.ts:21](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L21)*

___

### alt

•  **alt**: \<R, E, A>(that: Lazy\<Kind3\<F, R, E, A>>) => (fa: Kind3\<F, R, E, A>) => Kind3\<F, R, E, A>

*Defined in [src/Future/exports.ts:56](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L56)*

___

### ap

•  **ap**: \<R, E, A>(fa: Kind3\<F, R, E, A>) => \<B>(fab: Kind3\<F, R, E, (a: A) => B>) => Kind3\<F, R, E, B>

*Defined in [src/Future/exports.ts:57](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L57)*

___

### apFirst

•  **apFirst**: \<R, E, B>(fb: Kind3\<F, R, E, B>) => \<A>(fa: Kind3\<F, R, E, A>) => Kind3\<F, R, E, A>

*Defined in [src/Future/exports.ts:58](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L58)*

___

### apSecond

•  **apSecond**: \<R, E, B>(fb: Kind3\<F, R, E, B>) => \<A>(fa: Kind3\<F, R, E, A>) => Kind3\<F, R, E, B>

*Defined in [src/Future/exports.ts:59](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L59)*

___

### bimap

•  **bimap**: \<E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => \<R>(fa: Kind3\<F, R, E, A>) => Kind3\<F, R, G, B>

*Defined in [src/Future/exports.ts:63](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L63)*

___

### chain

•  **chain**: \<R, E, A, B>(f: (a: A) => Kind3\<F, R, E, B>) => (ma: Kind3\<F, R, E, A>) => Kind3\<F, R, E, B>

*Defined in [src/Future/exports.ts:60](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L60)*

___

### chainFirst

•  **chainFirst**: \<R, E, A, B>(f: (a: A) => Kind3\<F, R, E, B>) => (ma: Kind3\<F, R, E, A>) => Kind3\<F, R, E, A>

*Defined in [src/Future/exports.ts:61](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L61)*

___

### flatten

•  **flatten**: \<R, E, A>(mma: Kind3\<F, R, E, Kind3\<F, R, E, A>>) => Kind3\<F, R, E, A>

*Defined in [src/Future/exports.ts:65](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L65)*

___

### map

•  **map**: \<A, B>(f: (a: A) => B) => \<R, E>(fa: Kind3\<F, R, E, A>) => Kind3\<F, R, E, B>

*Defined in [src/Future/exports.ts:62](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L62)*

___

### mapLeft

•  **mapLeft**: \<E, G>(f: (e: E) => G) => \<R, A>(fa: Kind3\<F, R, E, A>) => Kind3\<F, R, G, A>

*Defined in [src/Future/exports.ts:64](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L64)*

## Functions

### fromReaderTaskEither

▸ **fromReaderTaskEither**\<E, A, B>(`rte`: ReaderTaskEither\<E, A, B>): [Future](_future_exports_.md#future)\<E, A, B>

*Defined in [src/Future/exports.ts:91](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L91)*

Convert a ReaderTaskEither into a Future

#### Type parameters:

Name |
------ |
`E` |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`rte` | ReaderTaskEither\<E, A, B> |

**Returns:** [Future](_future_exports_.md#future)\<E, A, B>

___

### left

▸ `Const`**left**\<A, B>(`value`: A): [Future](_future_exports_.md#future)\<unknown, A, B>

*Defined in [src/Future/exports.ts:48](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L48)*

Create a Left Effect

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** [Future](_future_exports_.md#future)\<unknown, A, B>

___

### orFail

▸ `Const`**orFail**\<K, E, A, B>(`key`: K, `future`: [Future](_future_exports_.md#future)\<E, A, B>): [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, A>, B>

*Defined in [src/Future/exports.ts:71](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L71)*

Convert an Either into a type-safe Effect failure.

#### Type parameters:

Name | Type |
------ | ------ |
`K` | PropertyKey |
`E` | - |
`A` | - |
`B` | - |

#### Parameters:

Name | Type |
------ | ------ |
`key` | K |
`future` | [Future](_future_exports_.md#future)\<E, A, B> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, A>, B>

___

### right

▸ `Const`**right**\<A, B>(`value`: B): [Future](_future_exports_.md#future)\<unknown, A, B>

*Defined in [src/Future/exports.ts:53](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L53)*

Create a Right Effect

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | B |

**Returns:** [Future](_future_exports_.md#future)\<unknown, A, B>

___

### toReaderTaskEither

▸ `Const`**toReaderTaskEither**\<E, A, B>(`future`: [Future](_future_exports_.md#future)\<E, A, B>): ReaderTaskEither\<E, A, B>

*Defined in [src/Future/exports.ts:98](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L98)*

Convert a Future into a ReaderTaskEither

#### Type parameters:

Name |
------ |
`E` |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`future` | [Future](_future_exports_.md#future)\<E, A, B> |

**Returns:** ReaderTaskEither\<E, A, B>

## Object literals

### future

▪ `Const` **future**: object

*Defined in [src/Future/exports.ts:35](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L35)*

A Monad, Alt and Either transformer instance of Effect with parallel Applicative.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@typed/fp/Future/exports\" | \"@typed/fp/Future/exports\" |

___

### futureSeq

▪ `Const` **futureSeq**: object

*Defined in [src/Future/exports.ts:40](https://github.com/TylorS/typed-fp/blob/8639976/src/Future/exports.ts#L40)*

A Monad, Alt and Either transformer instance of Effect with sequential Applicative.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@typed/fp/Future/exports\" | \"@typed/fp/Future/exports\" |
