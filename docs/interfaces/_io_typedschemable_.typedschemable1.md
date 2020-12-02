**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["io/TypedSchemable"](../modules/_io_typedschemable_.md) / TypedSchemable1

# Interface: TypedSchemable1\<S>

## Type parameters

Name | Type |
------ | ------ |
`S` | URIS |

## Hierarchy

* Schemable1\<S>

* WithUnion1\<S>

* WithRefine1\<S>

  ↳ **TypedSchemable1**

## Index

### Properties

* [URI](_io_typedschemable_.typedschemable1.md#uri)
* [array](_io_typedschemable_.typedschemable1.md#array)
* [bigint](_io_typedschemable_.typedschemable1.md#bigint)
* [boolean](_io_typedschemable_.typedschemable1.md#boolean)
* [date](_io_typedschemable_.typedschemable1.md#date)
* [either](_io_typedschemable_.typedschemable1.md#either)
* [int](_io_typedschemable_.typedschemable1.md#int)
* [intersect](_io_typedschemable_.typedschemable1.md#intersect)
* [json](_io_typedschemable_.typedschemable1.md#json)
* [jsonArray](_io_typedschemable_.typedschemable1.md#jsonarray)
* [jsonPrimitive](_io_typedschemable_.typedschemable1.md#jsonprimitive)
* [jsonRecord](_io_typedschemable_.typedschemable1.md#jsonrecord)
* [lazy](_io_typedschemable_.typedschemable1.md#lazy)
* [literal](_io_typedschemable_.typedschemable1.md#literal)
* [map](_io_typedschemable_.typedschemable1.md#map)
* [never](_io_typedschemable_.typedschemable1.md#never)
* [newtype](_io_typedschemable_.typedschemable1.md#newtype)
* [nullable](_io_typedschemable_.typedschemable1.md#nullable)
* [number](_io_typedschemable_.typedschemable1.md#number)
* [option](_io_typedschemable_.typedschemable1.md#option)
* [partial](_io_typedschemable_.typedschemable1.md#partial)
* [propertyKey](_io_typedschemable_.typedschemable1.md#propertykey)
* [record](_io_typedschemable_.typedschemable1.md#record)
* [refine](_io_typedschemable_.typedschemable1.md#refine)
* [remoteData](_io_typedschemable_.typedschemable1.md#remotedata)
* [set](_io_typedschemable_.typedschemable1.md#set)
* [string](_io_typedschemable_.typedschemable1.md#string)
* [sum](_io_typedschemable_.typedschemable1.md#sum)
* [symbol](_io_typedschemable_.typedschemable1.md#symbol)
* [tuple](_io_typedschemable_.typedschemable1.md#tuple)
* [type](_io_typedschemable_.typedschemable1.md#type)
* [union](_io_typedschemable_.typedschemable1.md#union)
* [unknown](_io_typedschemable_.typedschemable1.md#unknown)
* [uuid](_io_typedschemable_.typedschemable1.md#uuid)

## Properties

### URI

• `Readonly` **URI**: S

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[URI](_io_typedschemable_.typedschemable1.md#uri)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:69*

___

### array

• `Readonly` **array**: \<A>(item: Kind\<S, A>) => Kind\<S, Array\<A>>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[array](_io_typedschemable_.typedschemable1.md#array)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:98*

___

### bigint

• `Readonly` **bigint**: Kind\<S, BigInt>

*Defined in [src/io/TypedSchemable.ts:62](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L62)*

___

### boolean

• `Readonly` **boolean**: Kind\<S, boolean>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[boolean](_io_typedschemable_.typedschemable1.md#boolean)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:73*

___

### date

• `Readonly` **date**: Kind\<S, Date>

*Defined in [src/io/TypedSchemable.ts:59](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L59)*

___

### either

• `Readonly` **either**: \<A, B>(left: Kind\<S, A>, right: Kind\<S, B>) => Kind\<S, Either\<A, B>>

*Defined in [src/io/TypedSchemable.ts:57](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L57)*

___

### int

• `Readonly` **int**: Kind\<S, Int>

*Defined in [src/io/TypedSchemable.ts:61](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L61)*

___

### intersect

• `Readonly` **intersect**: \<B>(right: Kind\<S, B>) => \<A>(left: Kind\<S, A>) => Kind\<S, A & B>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[intersect](_io_typedschemable_.typedschemable1.md#intersect)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:104*

___

### json

• `Readonly` **json**: Kind\<S, Json>

*Defined in [src/io/TypedSchemable.ts:67](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L67)*

___

### jsonArray

• `Readonly` **jsonArray**: Kind\<S, JsonArray>

*Defined in [src/io/TypedSchemable.ts:69](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L69)*

___

### jsonPrimitive

• `Readonly` **jsonPrimitive**: Kind\<S, string \| number \| boolean \| null>

*Defined in [src/io/TypedSchemable.ts:70](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L70)*

___

### jsonRecord

• `Readonly` **jsonRecord**: Kind\<S, JsonRecord>

*Defined in [src/io/TypedSchemable.ts:68](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L68)*

___

### lazy

• `Readonly` **lazy**: \<A>(id: string, f: () => Kind\<S, A>) => Kind\<S, A>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[lazy](_io_typedschemable_.typedschemable1.md#lazy)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:112*

___

### literal

• `Readonly` **literal**: \<A>(...values: A) => Kind\<S, A[number]>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[literal](_io_typedschemable_.typedschemable1.md#literal)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:70*

___

### map

• `Readonly` **map**: \<A, B>(key: Kind\<S, A>, value: Kind\<S, B>) => Kind\<S, ReadonlyMap\<A, B>>

*Defined in [src/io/TypedSchemable.ts:55](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L55)*

___

### never

• `Readonly` **never**: Kind\<S, never>

*Defined in [src/io/TypedSchemable.ts:64](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L64)*

___

### newtype

• `Readonly` **newtype**: \<N>(from: Kind\<S, CarrierOf\<N>>, refinement: [Match](../modules/_logic_types_.match.md)\<CarrierOf\<N>, N>, id: string) => Kind\<S, N>

*Defined in [src/io/TypedSchemable.ts:71](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L71)*

___

### nullable

• `Readonly` **nullable**: \<A>(or: Kind\<S, A>) => Kind\<S, null \| A>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[nullable](_io_typedschemable_.typedschemable1.md#nullable)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:74*

___

### number

• `Readonly` **number**: Kind\<S, number>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[number](_io_typedschemable_.typedschemable1.md#number)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:72*

___

### option

• `Readonly` **option**: \<A>(Kind: Kind\<S, A>) => Kind\<S, Option\<A>>

*Defined in [src/io/TypedSchemable.ts:56](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L56)*

___

### partial

• `Readonly` **partial**: \<A>(properties: {}) => Kind\<S, Partial\<{}>>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[partial](_io_typedschemable_.typedschemable1.md#partial)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:85*

___

### propertyKey

• `Readonly` **propertyKey**: Kind\<S, PropertyKey>

*Defined in [src/io/TypedSchemable.ts:66](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L66)*

___

### record

• `Readonly` **record**: \<A>(codomain: Kind\<S, A>) => Kind\<S, Record\<string, A>>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[record](_io_typedschemable_.typedschemable1.md#record)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:97*

___

### refine

• `Readonly` **refine**: \<A, B>(refinement: (a: A) => a is B, id: string) => (from: Kind\<S, A>) => Kind\<S, B>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[refine](_io_typedschemable_.typedschemable1.md#refine)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:226*

___

### remoteData

• `Readonly` **remoteData**: \<A, B>(left: Kind\<S, A>, right: Kind\<S, B>) => Kind\<S, [RemoteData](../modules/_remotedata_remotedata_.md#remotedata)\<A, B>>

*Defined in [src/io/TypedSchemable.ts:58](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L58)*

___

### set

• `Readonly` **set**: \<A>(hkt: Kind\<S, A>) => Kind\<S, ReadonlySet\<A>>

*Defined in [src/io/TypedSchemable.ts:54](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L54)*

___

### string

• `Readonly` **string**: Kind\<S, string>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[string](_io_typedschemable_.typedschemable1.md#string)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:71*

___

### sum

• `Readonly` **sum**: \<T>(tag: T) => \<A>(members: {}) => Kind\<S, A[keyof A]>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[sum](_io_typedschemable_.typedschemable1.md#sum)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:105*

___

### symbol

• `Readonly` **symbol**: Kind\<S, symbol>

*Defined in [src/io/TypedSchemable.ts:65](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L65)*

___

### tuple

• `Readonly` **tuple**: \<A>(...components: {}) => Kind\<S, A>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[tuple](_io_typedschemable_.typedschemable1.md#tuple)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:99*

___

### type

• `Readonly` **type**: \<A>(properties: {}) => Kind\<S, {}>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[type](_io_typedschemable_.typedschemable1.md#type)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:75*

___

### union

• `Readonly` **union**: \<A>(...members: {}) => Kind\<S, A[number]>

*Inherited from [TypedSchemable1](_io_typedschemable_.typedschemable1.md).[union](_io_typedschemable_.typedschemable1.md#union)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:200*

___

### unknown

• `Readonly` **unknown**: Kind\<S, unknown>

*Defined in [src/io/TypedSchemable.ts:63](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L63)*

___

### uuid

• `Readonly` **uuid**: Kind\<S, [Uuid](../modules/_uuid_common_.uuid.md)>

*Defined in [src/io/TypedSchemable.ts:60](https://github.com/TylorS/typed-fp/blob/559f273/src/io/TypedSchemable.ts#L60)*
