**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Stream/exports"

# Module: "Stream/exports"

## Index

### Modules

* ["HKT"](_stream_exports_._hkt_.md)

### Type aliases

* [URI](_stream_exports_.md#uri)

### Variables

* [URI](_stream_exports_.md#uri)
* [alt](_stream_exports_.md#alt)
* [apFirst](_stream_exports_.md#apfirst)
* [apSecond](_stream_exports_.md#apsecond)
* [chainFirst](_stream_exports_.md#chainfirst)
* [filterMap](_stream_exports_.md#filtermap)
* [partition](_stream_exports_.md#partition)
* [partitionMap](_stream_exports_.md#partitionmap)

### Functions

* [\_filterMap](_stream_exports_.md#_filtermap)
* [\_partitionMap](_stream_exports_.md#_partitionmap)
* [compact](_stream_exports_.md#compact)
* [fromEffect](_stream_exports_.md#fromeffect)
* [getMonoid](_stream_exports_.md#getmonoid)
* [separate](_stream_exports_.md#separate)

### Object literals

* [stream](_stream_exports_.md#stream)

## Type aliases

### URI

Ƭ  **URI**: *typeof* [URI](_stream_exports_.md#uri)

*Defined in [src/Stream/exports.ts:20](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L20)*

## Variables

### URI

• `Const` **URI**: \"@most/core/Stream\" = '@most/core/Stream' as const

*Defined in [src/Stream/exports.ts:18](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L18)*

___

### alt

•  **alt**: \<A>(that: Lazy\<Kind\<F, A>>) => (fa: Kind\<F, A>) => Kind\<F, A>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### apFirst

•  **apFirst**: \<B>(fb: Kind\<F, B>) => \<A>(fa: Kind\<F, A>) => Kind\<F, A>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### apSecond

•  **apSecond**: \<B>(fb: Kind\<F, B>) => \<A>(fa: Kind\<F, A>) => Kind\<F, B>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### chainFirst

•  **chainFirst**: \<A, B>(f: (a: A) => Kind\<F, B>) => (ma: Kind\<F, A>) => Kind\<F, A>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### filterMap

•  **filterMap**: \<A, B>(f: (a: A) => Option\<B>) => (fa: Kind\<F, A>) => Kind\<F, B>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### partition

•  **partition**: \<A, B>(refinement: Refinement\<A, B>) => (fa: Kind\<F, A>) => Separated\<Kind\<F, A>, Kind\<F, B>>\<A>(predicate: Predicate\<A>) => (fa: Kind\<F, A>) => Separated\<Kind\<F, A>, Kind\<F, A>>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

___

### partitionMap

•  **partitionMap**: \<A, B, C>(f: (a: A) => Either\<B, C>) => (fa: Kind\<F, A>) => Separated\<Kind\<F, B>, Kind\<F, C>>

*Defined in [src/Stream/exports.ts:78](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L78)*

## Functions

### \_filterMap

▸ `Const`**_filterMap**\<A, B>(`fa`: Stream\<A>, `f`: (a: A) => Option\<B>): Stream\<B>

*Defined in [src/Stream/exports.ts:56](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L56)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`fa` | Stream\<A> |
`f` | (a: A) => Option\<B> |

**Returns:** Stream\<B>

___

### \_partitionMap

▸ `Const`**_partitionMap**\<A, B, C>(`fa`: Stream\<A>, `f`: (a: A) => Either\<B, C>): Separated\<Stream\<B>, Stream\<C>>

*Defined in [src/Stream/exports.ts:55](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L55)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`fa` | Stream\<A> |
`f` | (a: A) => Either\<B, C> |

**Returns:** Separated\<Stream\<B>, Stream\<C>>

___

### compact

▸ `Const`**compact**\<A>(`stream`: Stream\<Option\<A>>): Stream\<A>

*Defined in [src/Stream/exports.ts:41](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L41)*

Filter Option's from within a Stream

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`stream` | Stream\<Option\<A>> |

**Returns:** Stream\<A>

___

### fromEffect

▸ `Const`**fromEffect**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>, `env`: E): Stream\<A>

*Defined in [src/Stream/exports.ts:85](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L85)*

Convert an Effect into a Stream.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |
`env` | E |

**Returns:** Stream\<A>

___

### getMonoid

▸ `Const`**getMonoid**\<A>(): Monoid\<Stream\<A>>

*Defined in [src/Stream/exports.ts:31](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L31)*

Create a Stream monoid where concat is a parallel merge.

#### Type parameters:

Name |
------ |
`A` |

**Returns:** Monoid\<Stream\<A>>

___

### separate

▸ `Const`**separate**\<A, B>(`stream`: Stream\<Either\<A, B>>): Separated\<Stream\<A>, Stream\<B>>

*Defined in [src/Stream/exports.ts:47](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L47)*

Separate left and right values

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`stream` | Stream\<Either\<A, B>> |

**Returns:** Separated\<Stream\<A>, Stream\<B>>

## Object literals

### stream

▪ `Const` **stream**: object

*Defined in [src/Stream/exports.ts:61](https://github.com/TylorS/typed-fp/blob/559f273/src/Stream/exports.ts#L61)*

Monad, Alternative, and Filterable instances for @most/core Streams.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@most/core/Stream\" | \"@most/core/Stream\" |
`ap` | Ap | Ap |
`compact` | compact | compact |
`filterMap` | [\_filterMap](_stream_exports_.md#_filtermap) | \_filterMap |
`of` | function | now |
`partitionMap` | [\_partitionMap](_stream_exports_.md#_partitionmap) | \_partitionMap |
`separate` | separate | separate |
`zero` | function | empty |
`alt` | function | (fa: Stream\<A>, f: Lazy\<Stream\<A>>) => Stream\<A> |
`chain` | function | (fa: Stream\<A>, f: (a: A) => Kind\<F, B>) => Stream\<B> |
`filter` | function | \<A>(fa: Stream\<A>, p: Predicate\<A>) => Stream\<A> |
`map` | function | (fa: Stream\<A>, f: (a: A) => B) => Stream\<B> |
`partition` | function | \<A>(fa: Stream\<A>, predicate: Predicate\<A>) => Separated\<Stream\<A>, Stream\<A>> |
