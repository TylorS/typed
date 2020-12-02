**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/Guard"

# Module: "io/Guard"

## Index

### Variables

* [json](_io_guard_.md#json)
* [jsonArray](_io_guard_.md#jsonarray)
* [jsonPrimitive](_io_guard_.md#jsonprimitive)
* [jsonRecord](_io_guard_.md#jsonrecord)
* [progress](_io_guard_.md#progress)

### Functions

* [either](_io_guard_.md#either)
* [map](_io_guard_.md#map)
* [option](_io_guard_.md#option)
* [remoteData](_io_guard_.md#remotedata)
* [set](_io_guard_.md#set)

### Object literals

* [Schemable](_io_guard_.md#schemable)
* [bigint](_io_guard_.md#bigint)
* [date](_io_guard_.md#date)
* [int](_io_guard_.md#int)
* [symbol](_io_guard_.md#symbol)
* [unknown](_io_guard_.md#unknown)
* [uuid](_io_guard_.md#uuid)

## Variables

### json

• `Const` **json**: Guard\<unknown, Json> = G.lazy(() => G.union(jsonRecord, jsonArray, jsonPrimitive),)

*Defined in [src/io/Guard.ts:115](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L115)*

Create a Guard instance for Json

___

### jsonArray

• `Const` **jsonArray**: Guard\<unknown, JsonArray> = G.array(json)

*Defined in [src/io/Guard.ts:125](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L125)*

Create a Guard instance for JsonArray

___

### jsonPrimitive

• `Const` **jsonPrimitive**: Guard\<unknown, string \| number \| boolean \| null> = G.nullable( G.union(G.string, G.number, G.boolean),)

*Defined in [src/io/Guard.ts:129](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L129)*

Create a Guard instance for Json Primitives

___

### jsonRecord

• `Const` **jsonRecord**: Guard\<unknown, JsonRecord> = G.record(json)

*Defined in [src/io/Guard.ts:121](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L121)*

Create a Guard instance for JsonRecord

___

### progress

• `Const` **progress**: Guard\<unknown, [Progress](../interfaces/_remotedata_progress_.progress.md)> = G.type({ loaded: G.number, total: option(G.number),})

*Defined in [src/io/Guard.ts:99](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L99)*

Create a Guard instance for RemoteData's Progress

## Functions

### either

▸ `Const`**either**\<A, B>(`left`: Guard\<unknown, A>, `right`: Guard\<unknown, B>): Guard\<unknown, Either\<A, B>>

*Defined in [src/io/Guard.ts:38](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L38)*

Create a Guard instance for Either<A, B>

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`left` | Guard\<unknown, A> |
`right` | Guard\<unknown, B> |

**Returns:** Guard\<unknown, Either\<A, B>>

___

### map

▸ `Const`**map**\<A, B>(`k`: Guard\<unknown, A>, `v`: Guard\<unknown, B>): object

*Defined in [src/io/Guard.ts:22](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L22)*

Create a Guard instance for Map

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`k` | Guard\<unknown, A> |
`v` | Guard\<unknown, B> |

**Returns:** object

Name | Type |
------ | ------ |
`is` | (u: unknown) => u is ReadonlyMap\<A, B> |

___

### option

▸ `Const`**option**\<A>(`v`: Guard\<unknown, A>): Guard\<unknown, Option\<A>>

*Defined in [src/io/Guard.ts:32](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L32)*

Create a Guard instance for Option<A>

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`v` | Guard\<unknown, A> |

**Returns:** Guard\<unknown, Option\<A>>

___

### remoteData

▸ `Const`**remoteData**\<A, B>(`left`: Guard\<unknown, A>, `right`: Guard\<unknown, B>): Guard\<unknown, [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>>

*Defined in [src/io/Guard.ts:47](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L47)*

Create a Guard instance for RemoteData<A, B>

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`left` | Guard\<unknown, A> |
`right` | Guard\<unknown, B> |

**Returns:** Guard\<unknown, [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>>

___

### set

▸ `Const`**set**\<A>(`t`: Guard\<unknown, A>): Guard\<unknown, ReadonlySet\<A>>

*Defined in [src/io/Guard.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L15)*

Create a Guard instance for Set

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`t` | Guard\<unknown, A> |

**Returns:** Guard\<unknown, ReadonlySet\<A>>

## Object literals

### Schemable

▪ `Const` **Schemable**: object

*Defined in [src/io/Guard.ts:141](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L141)*

TypedSchemable instance for Guard

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`bigint` | Guard\<unknown, BigInt> | Guard\<unknown, BigInt> |
`date` | Guard\<unknown, Date> | Guard\<unknown, Date> |
`either` | either | either |
`int` | Guard\<unknown, Branded\<number, IntBrand>> | Guard\<unknown, Branded\<number, IntBrand>> |
`json` | Guard\<unknown, Json> | Guard\<unknown, Json> |
`jsonArray` | Guard\<unknown, JsonArray> | Guard\<unknown, JsonArray> |
`jsonPrimitive` | Guard\<unknown, null \| string \| number \| false \| true> | Guard\<unknown, null \| string \| number \| false \| true> |
`jsonRecord` | Guard\<unknown, JsonRecord> | Guard\<unknown, JsonRecord> |
`map` | map | map |
`option` | option | option |
`propertyKey` | Guard\<unknown, string \| number \| symbol> | G.union(G.Schemable.string, G.Schemable.number, symbol) |
`remoteData` | remoteData | remoteData |
`set` | [set](_storage_proxystorage_.md#set) | [set](_storage_proxystorage_.md#set) |
`symbol` | Guard\<unknown, symbol> | Guard\<unknown, symbol> |
`unknown` | Guard\<unknown, unknown> | Guard\<unknown, unknown> |
`uuid` | Guard\<unknown, [Uuid](_uuid_common_.uuid.md)> | Guard\<unknown, [Uuid](_uuid_common_.uuid.md)> |
`newtype` | function | \<A>(from: Guard\<unknown, CarrierOf\<A>>, refine: [Match](_logic_types_.match.md)\<CarrierOf\<A>, A>) => Guard\<unknown, A> |
`never` | object | { is: (\_: unknown) => \_ is never  } |

___

### bigint

▪ `Const` **bigint**: object

*Defined in [src/io/Guard.ts:92](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L92)*

Create a Guard instance for BigInt

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (u: unknown) => u is BigInt |

___

### date

▪ `Const` **date**: object

*Defined in [src/io/Guard.ts:71](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L71)*

Guard instance for Date

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (u: unknown) => u is Date |

___

### int

▪ `Const` **int**: object

*Defined in [src/io/Guard.ts:85](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L85)*

Create a Guard instance for Int

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (u: unknown) => u is Int |

___

### symbol

▪ `Const` **symbol**: object

*Defined in [src/io/Guard.ts:136](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L136)*

Create a Guard instance for symbol

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (u: unknown) => u is symbol |

___

### unknown

▪ `Const` **unknown**: object

*Defined in [src/io/Guard.ts:107](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L107)*

Create a Guard instance for `unknown`

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (\_u: unknown) => \_u is unknown |

___

### uuid

▪ `Const` **uuid**: object

*Defined in [src/io/Guard.ts:78](https://github.com/TylorS/typed-fp/blob/8639976/src/io/Guard.ts#L78)*

Create a Guard instance for Uuid

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`is` | function | (u: unknown) => u is Uuid |
