**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/model/SharedKeyStore"](../modules/_shared_core_model_sharedkeystore_.md) / SharedKeyStore

# Interface: SharedKeyStore\<S>

A Map of SharedKeys to Shared values.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`S` | [Shared](../modules/_shared_core_model_shared_.shared.md) | Shared |

## Hierarchy

* [Map](_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>>

  ↳ **SharedKeyStore**

## Index

### Properties

* [Map](_shared_core_model_sharedkeystore_.sharedkeystore.md#map)
* [[Symbol.toStringTag]](_shared_core_model_sharedkeystore_.sharedkeystore.md#[symbol.tostringtag])
* [size](_shared_core_model_sharedkeystore_.sharedkeystore.md#size)

### Methods

* [[Symbol.iterator]](_shared_core_model_sharedkeystore_.sharedkeystore.md#[symbol.iterator])
* [clear](_shared_core_model_sharedkeystore_.sharedkeystore.md#clear)
* [delete](_shared_core_model_sharedkeystore_.sharedkeystore.md#delete)
* [entries](_shared_core_model_sharedkeystore_.sharedkeystore.md#entries)
* [forEach](_shared_core_model_sharedkeystore_.sharedkeystore.md#foreach)
* [get](_shared_core_model_sharedkeystore_.sharedkeystore.md#get)
* [has](_shared_core_model_sharedkeystore_.sharedkeystore.md#has)
* [keys](_shared_core_model_sharedkeystore_.sharedkeystore.md#keys)
* [set](_shared_core_model_sharedkeystore_.sharedkeystore.md#set)
* [values](_shared_core_model_sharedkeystore_.sharedkeystore.md#values)

## Properties

### Map

•  **Map**: MapConstructor

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:36*

___

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: string

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[[Symbol.toStringTag]](_shared_core_model_sharedkeystore_.sharedkeystore.md#[symbol.tostringtag])*

*Defined in node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:135*

___

### size

• `Readonly` **size**: number

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[size](_shared_core_model_sharedkeystore_.sharedkeystore.md#size)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:28*

## Methods

### [Symbol.iterator]

▸ **[Symbol.iterator]**(): IterableIterator\<[[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>]>

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[[Symbol.iterator]](_shared_core_model_sharedkeystore_.sharedkeystore.md#[symbol.iterator])*

*Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:121*

Returns an iterable of entries in the map.

**Returns:** IterableIterator\<[[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>]>

___

### clear

▸ **clear**(): void

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[clear](_shared_core_model_sharedkeystore_.sharedkeystore.md#clear)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:22*

**Returns:** void

___

### delete

▸ **delete**(`key`: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>): boolean

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[delete](_shared_core_model_sharedkeystore_.sharedkeystore.md#delete)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:23*

#### Parameters:

Name | Type |
------ | ------ |
`key` | [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S> |

**Returns:** boolean

___

### entries

▸ **entries**(): IterableIterator\<[[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>]>

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[entries](_shared_core_model_sharedkeystore_.sharedkeystore.md#entries)*

*Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:126*

Returns an iterable of key, value pairs for every entry in the map.

**Returns:** IterableIterator\<[[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>]>

___

### forEach

▸ **forEach**(`callbackfn`: (value: [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>, key: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, map: [Map](_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>>) => void, `thisArg?`: any): void

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[forEach](_shared_core_model_sharedkeystore_.sharedkeystore.md#foreach)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:24*

#### Parameters:

Name | Type |
------ | ------ |
`callbackfn` | (value: [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>, key: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, map: [Map](_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>>) => void |
`thisArg?` | any |

**Returns:** void

___

### get

▸ **get**(`key`: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>): [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S> \| undefined

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[get](_shared_core_model_sharedkeystore_.sharedkeystore.md#get)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:25*

#### Parameters:

Name | Type |
------ | ------ |
`key` | [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S> |

**Returns:** [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S> \| undefined

___

### has

▸ **has**(`key`: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>): boolean

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[has](_shared_core_model_sharedkeystore_.sharedkeystore.md#has)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:26*

#### Parameters:

Name | Type |
------ | ------ |
`key` | [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S> |

**Returns:** boolean

___

### keys

▸ **keys**(): IterableIterator\<[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>>

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[keys](_shared_core_model_sharedkeystore_.sharedkeystore.md#keys)*

*Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:131*

Returns an iterable of keys in the map

**Returns:** IterableIterator\<[GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>>

___

### set

▸ **set**(`key`: [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S>, `value`: [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>): this

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[set](_shared_core_model_sharedkeystore_.sharedkeystore.md#set)*

*Defined in node_modules/typescript/lib/lib.es2015.collection.d.ts:27*

#### Parameters:

Name | Type |
------ | ------ |
`key` | [GetSharedKey](../modules/_shared_core_model_shared_.md#getsharedkey)\<S> |
`value` | [GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S> |

**Returns:** this

___

### values

▸ **values**(): IterableIterator\<[GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>>

*Inherited from [SharedKeyStore](_shared_core_model_sharedkeystore_.sharedkeystore.md).[values](_shared_core_model_sharedkeystore_.sharedkeystore.md#values)*

*Defined in node_modules/typescript/lib/lib.es2015.iterable.d.ts:136*

Returns an iterable of values in the map

**Returns:** IterableIterator\<[GetSharedValue](../modules/_shared_core_model_shared_.md#getsharedvalue)\<S>>
