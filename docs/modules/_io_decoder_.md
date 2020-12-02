**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/Decoder"

# Module: "io/Decoder"

## Index

### Variables

* [progress](_io_decoder_.md#progress)

### Functions

* [either](_io_decoder_.md#either)
* [map](_io_decoder_.md#map)
* [option](_io_decoder_.md#option)
* [remoteData](_io_decoder_.md#remotedata)
* [set](_io_decoder_.md#set)

### Object literals

* [Schemable](_io_decoder_.md#schemable)

## Variables

### progress

• `Const` **progress**: Decoder\<unknown, [Progress](../interfaces/_remotedata_progress_.progress.md)> = D.type({ loaded: D.number, total: option(D.number),})

*Defined in [src/io/Decoder.ts:83](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L83)*

A Decoder instance for RemoteData Progress

## Functions

### either

▸ `Const`**either**\<A, B>(`left`: Decoder\<unknown, A>, `right`: Decoder\<unknown, B>): Decoder\<unknown, E.Either\<A, B>>

*Defined in [src/io/Decoder.ts:74](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L74)*

Create a Decoder instance for Either<A, B>

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`left` | Decoder\<unknown, A> |
`right` | Decoder\<unknown, B> |

**Returns:** Decoder\<unknown, E.Either\<A, B>>

___

### map

▸ `Const`**map**\<A, B>(`key`: Decoder\<unknown, A>, `value`: Decoder\<unknown, B>): Decoder\<unknown, ReadonlyMap\<A, B>>

*Defined in [src/io/Decoder.ts:40](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L40)*

Create a Decoder instance for a Map<K, V>

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`key` | Decoder\<unknown, A> |
`value` | Decoder\<unknown, B> |

**Returns:** Decoder\<unknown, ReadonlyMap\<A, B>>

___

### option

▸ `Const`**option**\<A>(`v`: Decoder\<unknown, A>): Decoder\<unknown, O.Option\<A>>

*Defined in [src/io/Decoder.ts:68](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L68)*

Create a Decoder instance for Option<A>

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`v` | Decoder\<unknown, A> |

**Returns:** Decoder\<unknown, O.Option\<A>>

___

### remoteData

▸ `Const`**remoteData**\<A, B>(`left`: Decoder\<unknown, A>, `right`: Decoder\<unknown, B>): Decoder\<unknown, [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>>

*Defined in [src/io/Decoder.ts:91](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L91)*

A Decoder instance for RemoteData

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`left` | Decoder\<unknown, A> |
`right` | Decoder\<unknown, B> |

**Returns:** Decoder\<unknown, [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>>

___

### set

▸ `Const`**set**\<A>(`from`: Decoder\<unknown, A>): Decoder\<unknown, ReadonlySet\<A>>

*Defined in [src/io/Decoder.ts:17](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L17)*

Create a Decoder instance for a Set

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`from` | Decoder\<unknown, A> |

**Returns:** Decoder\<unknown, ReadonlySet\<A>>

## Object literals

### Schemable

▪ `Const` **Schemable**: object

*Defined in [src/io/Decoder.ts:115](https://github.com/TylorS/typed-fp/blob/559f273/src/io/Decoder.ts#L115)*

A Decoder TypedSchemable instance

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`bigint` | Decoder\<unknown, BigInt> | D.fromGuard(G.bigint, \`BigInt\`) |
`date` | Decoder\<unknown, Date> | D.fromGuard(G.date, \`Date\`) |
`either` | either | either |
`int` | Decoder\<unknown, Branded\<number, IntBrand>> | D.fromGuard(G.int, \`Int\`) |
`json` | Decoder\<unknown, Json> | D.fromGuard(G.Schemable.json, \`Json\`) |
`jsonArray` | Decoder\<unknown, JsonArray> | D.fromGuard(G.Schemable.jsonArray, \`JsonArray\`) |
`jsonPrimitive` | Decoder\<unknown, null \| string \| number \| false \| true> | D.fromGuard(G.Schemable.jsonPrimitive, \`JsonPrimitive\`) |
`jsonRecord` | Decoder\<unknown, JsonRecord> | D.fromGuard(G.Schemable.jsonRecord, \`JsonRecord\`) |
`map` | map | map |
`never` | Decoder\<unknown, never> | D.fromGuard(G.Schemable.never, \`never\`) |
`option` | option | option |
`propertyKey` | Decoder\<unknown, string \| number \| symbol> | D.fromGuard(G.Schemable.propertyKey, \`PropertyKey\`) |
`remoteData` | remoteData | remoteData |
`set` | [set](_storage_proxystorage_.md#set) | [set](_storage_proxystorage_.md#set) |
`symbol` | Decoder\<unknown, symbol> | D.fromGuard(G.Schemable.symbol, \`symbol\`) |
`unknown` | Decoder\<unknown, unknown> | D.fromGuard(G.unknown, \`unknown\`) |
`uuid` | Decoder\<unknown, [Uuid](_uuid_common_.uuid.md)> | D.fromGuard(G.uuid, \`Uuid\`) |
`newtype` | function | \<A>(from: Decoder\<unknown, CarrierOf\<A>>, refine: [Match](_logic_types_.match.md)\<CarrierOf\<A>, A>, id: string) => Decoder\<unknown, A> |
