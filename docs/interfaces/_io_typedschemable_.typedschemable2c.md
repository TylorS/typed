**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["io/TypedSchemable"](../modules/_io_typedschemable_.md) / TypedSchemable2C

# Interface: TypedSchemable2C\<S, E>

## Type parameters

Name | Type |
------ | ------ |
`S` | URIS2 |
`E` | - |

## Hierarchy

* Schemable2C\<S, E>

* WithUnion2C\<S, E>

* WithRefine2C\<S, E>

  ↳ **TypedSchemable2C**

## Index

### Properties

* [URI](_io_typedschemable_.typedschemable2c.md#uri)
* [array](_io_typedschemable_.typedschemable2c.md#array)
* [bigint](_io_typedschemable_.typedschemable2c.md#bigint)
* [boolean](_io_typedschemable_.typedschemable2c.md#boolean)
* [date](_io_typedschemable_.typedschemable2c.md#date)
* [either](_io_typedschemable_.typedschemable2c.md#either)
* [int](_io_typedschemable_.typedschemable2c.md#int)
* [intersect](_io_typedschemable_.typedschemable2c.md#intersect)
* [json](_io_typedschemable_.typedschemable2c.md#json)
* [jsonArray](_io_typedschemable_.typedschemable2c.md#jsonarray)
* [jsonPrimitive](_io_typedschemable_.typedschemable2c.md#jsonprimitive)
* [jsonRecord](_io_typedschemable_.typedschemable2c.md#jsonrecord)
* [lazy](_io_typedschemable_.typedschemable2c.md#lazy)
* [literal](_io_typedschemable_.typedschemable2c.md#literal)
* [map](_io_typedschemable_.typedschemable2c.md#map)
* [never](_io_typedschemable_.typedschemable2c.md#never)
* [newtype](_io_typedschemable_.typedschemable2c.md#newtype)
* [nullable](_io_typedschemable_.typedschemable2c.md#nullable)
* [number](_io_typedschemable_.typedschemable2c.md#number)
* [option](_io_typedschemable_.typedschemable2c.md#option)
* [partial](_io_typedschemable_.typedschemable2c.md#partial)
* [propertyKey](_io_typedschemable_.typedschemable2c.md#propertykey)
* [record](_io_typedschemable_.typedschemable2c.md#record)
* [refine](_io_typedschemable_.typedschemable2c.md#refine)
* [remoteData](_io_typedschemable_.typedschemable2c.md#remotedata)
* [set](_io_typedschemable_.typedschemable2c.md#set)
* [string](_io_typedschemable_.typedschemable2c.md#string)
* [sum](_io_typedschemable_.typedschemable2c.md#sum)
* [symbol](_io_typedschemable_.typedschemable2c.md#symbol)
* [tuple](_io_typedschemable_.typedschemable2c.md#tuple)
* [type](_io_typedschemable_.typedschemable2c.md#type)
* [union](_io_typedschemable_.typedschemable2c.md#union)
* [unknown](_io_typedschemable_.typedschemable2c.md#unknown)
* [uuid](_io_typedschemable_.typedschemable2c.md#uuid)

## Properties

### URI

• `Readonly` **URI**: S

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[URI](_io_typedschemable_.typedschemable2c.md#uri)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:118*

___

### array

• `Readonly` **array**: \<A>(item: Kind2\<S, E, A>) => Kind2\<S, E, Array\<A>>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[array](_io_typedschemable_.typedschemable2c.md#array)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:149*

___

### bigint

• `Readonly` **bigint**: Kind2\<S, E, BigInt>

*Defined in [src/io/TypedSchemable.ts:93](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L93)*

___

### boolean

• `Readonly` **boolean**: Kind2\<S, E, boolean>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[boolean](_io_typedschemable_.typedschemable2c.md#boolean)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:122*

___

### date

• `Readonly` **date**: Kind2\<S, E, Date>

*Defined in [src/io/TypedSchemable.ts:90](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L90)*

___

### either

• `Readonly` **either**: \<A, B>(left: Kind2\<S, E, A>, right: Kind2\<S, E, B>) => Kind2\<S, E, Either\<A, B>>

*Defined in [src/io/TypedSchemable.ts:85](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L85)*

___

### int

• `Readonly` **int**: Kind2\<S, E, Int>

*Defined in [src/io/TypedSchemable.ts:92](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L92)*

___

### intersect

• `Readonly` **intersect**: \<B>(right: Kind2\<S, E, B>) => \<A>(left: Kind2\<S, E, A>) => Kind2\<S, E, A & B>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[intersect](_io_typedschemable_.typedschemable2c.md#intersect)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:155*

___

### json

• `Readonly` **json**: Kind2\<S, E, Json>

*Defined in [src/io/TypedSchemable.ts:98](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L98)*

___

### jsonArray

• `Readonly` **jsonArray**: Kind2\<S, E, JsonArray>

*Defined in [src/io/TypedSchemable.ts:100](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L100)*

___

### jsonPrimitive

• `Readonly` **jsonPrimitive**: Kind2\<S, E, string \| number \| boolean \| null>

*Defined in [src/io/TypedSchemable.ts:101](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L101)*

___

### jsonRecord

• `Readonly` **jsonRecord**: Kind2\<S, E, JsonRecord>

*Defined in [src/io/TypedSchemable.ts:99](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L99)*

___

### lazy

• `Readonly` **lazy**: \<A>(id: string, f: () => Kind2\<S, E, A>) => Kind2\<S, E, A>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[lazy](_io_typedschemable_.typedschemable2c.md#lazy)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:163*

___

### literal

• `Readonly` **literal**: \<A>(...values: A) => Kind2\<S, E, A[number]>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[literal](_io_typedschemable_.typedschemable2c.md#literal)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:119*

___

### map

• `Readonly` **map**: \<A, B>(key: Kind2\<S, E, A>, value: Kind2\<S, E, B>) => Kind2\<S, E, ReadonlyMap\<A, B>>

*Defined in [src/io/TypedSchemable.ts:83](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L83)*

___

### never

• `Readonly` **never**: Kind2\<S, E, never>

*Defined in [src/io/TypedSchemable.ts:95](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L95)*

___

### newtype

• `Readonly` **newtype**: \<N>(from: Kind2\<S, E, CarrierOf\<N>>, refinement: [Match](../modules/_logic_types_.match.md)\<CarrierOf\<N>, N>, id: string) => Kind2\<S, E, N>

*Defined in [src/io/TypedSchemable.ts:102](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L102)*

___

### nullable

• `Readonly` **nullable**: \<A>(or: Kind2\<S, E, A>) => Kind2\<S, E, null \| A>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[nullable](_io_typedschemable_.typedschemable2c.md#nullable)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:123*

___

### number

• `Readonly` **number**: Kind2\<S, E, number>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[number](_io_typedschemable_.typedschemable2c.md#number)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:121*

___

### option

• `Readonly` **option**: \<A>(k: Kind2\<S, E, A>) => Kind2\<S, E, Option\<A>>

*Defined in [src/io/TypedSchemable.ts:84](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L84)*

___

### partial

• `Readonly` **partial**: \<A>(properties: {}) => Kind2\<S, E, Partial\<{}>>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[partial](_io_typedschemable_.typedschemable2c.md#partial)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:135*

___

### propertyKey

• `Readonly` **propertyKey**: Kind2\<S, E, PropertyKey>

*Defined in [src/io/TypedSchemable.ts:97](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L97)*

___

### record

• `Readonly` **record**: \<A>(codomain: Kind2\<S, E, A>) => Kind2\<S, E, Record\<string, A>>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[record](_io_typedschemable_.typedschemable2c.md#record)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:148*

___

### refine

• `Readonly` **refine**: \<A, B>(refinement: (a: A) => a is B, id: string) => (from: Kind2\<S, E, A>) => Kind2\<S, E, B>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[refine](_io_typedschemable_.typedschemable2c.md#refine)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:232*

___

### remoteData

• `Readonly` **remoteData**: \<A, B>(left: Kind2\<S, E, A>, right: Kind2\<S, E, B>) => Kind2\<S, E, [RemoteData](../modules/_remotedata_remotedata_.md#remotedata)\<A, B>>

*Defined in [src/io/TypedSchemable.ts:86](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L86)*

___

### set

• `Readonly` **set**: \<A>(hkt: Kind2\<S, E, A>) => Kind2\<S, E, ReadonlySet\<A>>

*Defined in [src/io/TypedSchemable.ts:82](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L82)*

___

### string

• `Readonly` **string**: Kind2\<S, E, string>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[string](_io_typedschemable_.typedschemable2c.md#string)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:120*

___

### sum

• `Readonly` **sum**: \<T>(tag: T) => \<A>(members: {}) => Kind2\<S, E, A[keyof A]>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[sum](_io_typedschemable_.typedschemable2c.md#sum)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:156*

___

### symbol

• `Readonly` **symbol**: Kind2\<S, E, symbol>

*Defined in [src/io/TypedSchemable.ts:96](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L96)*

___

### tuple

• `Readonly` **tuple**: \<A>(...components: {}) => Kind2\<S, E, A>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[tuple](_io_typedschemable_.typedschemable2c.md#tuple)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:150*

___

### type

• `Readonly` **type**: \<A>(properties: {}) => Kind2\<S, E, {}>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[type](_io_typedschemable_.typedschemable2c.md#type)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:124*

___

### union

• `Readonly` **union**: \<A>(...members: {}) => Kind2\<S, E, A[number]>

*Inherited from [TypedSchemable2C](_io_typedschemable_.typedschemable2c.md).[union](_io_typedschemable_.typedschemable2c.md#union)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:210*

___

### unknown

• `Readonly` **unknown**: Kind2\<S, E, unknown>

*Defined in [src/io/TypedSchemable.ts:94](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L94)*

___

### uuid

• `Readonly` **uuid**: Kind2\<S, E, [Uuid](../modules/_uuid_common_.uuid.md)>

*Defined in [src/io/TypedSchemable.ts:91](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L91)*
