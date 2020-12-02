**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["io/TypedSchemable"](../modules/_io_typedschemable_.md) / TypedSchemable

# Interface: TypedSchemable\<S>

A Schemable interface with unions, refinements, and many other common data types
including Option, Either, RemoteData, Newtypes and more.

## Type parameters

Name |
------ |
`S` |

## Hierarchy

* Schemable\<S>

* WithUnion\<S>

* WithRefine\<S>

  ↳ **TypedSchemable**

## Index

### Properties

* [URI](_io_typedschemable_.typedschemable.md#uri)
* [array](_io_typedschemable_.typedschemable.md#array)
* [bigint](_io_typedschemable_.typedschemable.md#bigint)
* [boolean](_io_typedschemable_.typedschemable.md#boolean)
* [date](_io_typedschemable_.typedschemable.md#date)
* [either](_io_typedschemable_.typedschemable.md#either)
* [int](_io_typedschemable_.typedschemable.md#int)
* [intersect](_io_typedschemable_.typedschemable.md#intersect)
* [json](_io_typedschemable_.typedschemable.md#json)
* [jsonArray](_io_typedschemable_.typedschemable.md#jsonarray)
* [jsonPrimitive](_io_typedschemable_.typedschemable.md#jsonprimitive)
* [jsonRecord](_io_typedschemable_.typedschemable.md#jsonrecord)
* [lazy](_io_typedschemable_.typedschemable.md#lazy)
* [literal](_io_typedschemable_.typedschemable.md#literal)
* [map](_io_typedschemable_.typedschemable.md#map)
* [never](_io_typedschemable_.typedschemable.md#never)
* [newtype](_io_typedschemable_.typedschemable.md#newtype)
* [nullable](_io_typedschemable_.typedschemable.md#nullable)
* [number](_io_typedschemable_.typedschemable.md#number)
* [option](_io_typedschemable_.typedschemable.md#option)
* [partial](_io_typedschemable_.typedschemable.md#partial)
* [propertyKey](_io_typedschemable_.typedschemable.md#propertykey)
* [record](_io_typedschemable_.typedschemable.md#record)
* [refine](_io_typedschemable_.typedschemable.md#refine)
* [remoteData](_io_typedschemable_.typedschemable.md#remotedata)
* [set](_io_typedschemable_.typedschemable.md#set)
* [string](_io_typedschemable_.typedschemable.md#string)
* [sum](_io_typedschemable_.typedschemable.md#sum)
* [symbol](_io_typedschemable_.typedschemable.md#symbol)
* [tuple](_io_typedschemable_.typedschemable.md#tuple)
* [type](_io_typedschemable_.typedschemable.md#type)
* [union](_io_typedschemable_.typedschemable.md#union)
* [unknown](_io_typedschemable_.typedschemable.md#unknown)
* [uuid](_io_typedschemable_.typedschemable.md#uuid)

## Properties

### URI

• `Readonly` **URI**: S

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[URI](_io_typedschemable_.typedschemable.md#uri)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:20*

___

### array

• `Readonly` **array**: \<A>(item: HKT\<S, A>) => HKT\<S, Array\<A>>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[array](_io_typedschemable_.typedschemable.md#array)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:49*

___

### bigint

• `Readonly` **bigint**: HKT\<S, BigInt>

*Defined in [src/io/TypedSchemable.ts:34](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L34)*

___

### boolean

• `Readonly` **boolean**: HKT\<S, boolean>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[boolean](_io_typedschemable_.typedschemable.md#boolean)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:24*

___

### date

• `Readonly` **date**: HKT\<S, Date>

*Defined in [src/io/TypedSchemable.ts:31](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L31)*

___

### either

• `Readonly` **either**: \<A, B>(left: HKT\<S, A>, right: HKT\<S, B>) => HKT\<S, Either\<A, B>>

*Defined in [src/io/TypedSchemable.ts:29](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L29)*

___

### int

• `Readonly` **int**: HKT\<S, Int>

*Defined in [src/io/TypedSchemable.ts:33](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L33)*

___

### intersect

• `Readonly` **intersect**: \<B>(right: HKT\<S, B>) => \<A>(left: HKT\<S, A>) => HKT\<S, A & B>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[intersect](_io_typedschemable_.typedschemable.md#intersect)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:55*

___

### json

• `Readonly` **json**: HKT\<S, Json>

*Defined in [src/io/TypedSchemable.ts:39](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L39)*

___

### jsonArray

• `Readonly` **jsonArray**: HKT\<S, JsonArray>

*Defined in [src/io/TypedSchemable.ts:41](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L41)*

___

### jsonPrimitive

• `Readonly` **jsonPrimitive**: HKT\<S, string \| number \| boolean \| null>

*Defined in [src/io/TypedSchemable.ts:42](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L42)*

___

### jsonRecord

• `Readonly` **jsonRecord**: HKT\<S, JsonRecord>

*Defined in [src/io/TypedSchemable.ts:40](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L40)*

___

### lazy

• `Readonly` **lazy**: \<A>(id: string, f: () => HKT\<S, A>) => HKT\<S, A>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[lazy](_io_typedschemable_.typedschemable.md#lazy)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:63*

___

### literal

• `Readonly` **literal**: \<A>(...values: A) => HKT\<S, A[number]>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[literal](_io_typedschemable_.typedschemable.md#literal)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:21*

___

### map

• `Readonly` **map**: \<A, B>(key: HKT\<S, A>, value: HKT\<S, B>) => HKT\<S, ReadonlyMap\<A, B>>

*Defined in [src/io/TypedSchemable.ts:27](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L27)*

___

### never

• `Readonly` **never**: HKT\<S, never>

*Defined in [src/io/TypedSchemable.ts:36](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L36)*

___

### newtype

• `Readonly` **newtype**: \<N>(from: HKT\<S, CarrierOf\<N>>, refinement: [Match](../modules/_logic_types_.match.md)\<CarrierOf\<N>, N>, id: string) => HKT\<S, N>

*Defined in [src/io/TypedSchemable.ts:43](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L43)*

___

### nullable

• `Readonly` **nullable**: \<A>(or: HKT\<S, A>) => HKT\<S, null \| A>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[nullable](_io_typedschemable_.typedschemable.md#nullable)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:25*

___

### number

• `Readonly` **number**: HKT\<S, number>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[number](_io_typedschemable_.typedschemable.md#number)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:23*

___

### option

• `Readonly` **option**: \<A>(hkt: HKT\<S, A>) => HKT\<S, Option\<A>>

*Defined in [src/io/TypedSchemable.ts:28](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L28)*

___

### partial

• `Readonly` **partial**: \<A>(properties: {}) => HKT\<S, Partial\<{}>>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[partial](_io_typedschemable_.typedschemable.md#partial)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:36*

___

### propertyKey

• `Readonly` **propertyKey**: HKT\<S, PropertyKey>

*Defined in [src/io/TypedSchemable.ts:38](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L38)*

___

### record

• `Readonly` **record**: \<A>(codomain: HKT\<S, A>) => HKT\<S, Record\<string, A>>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[record](_io_typedschemable_.typedschemable.md#record)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:48*

___

### refine

• `Readonly` **refine**: \<A, B>(refinement: (a: A) => a is B, id: string) => (from: HKT\<S, A>) => HKT\<S, B>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[refine](_io_typedschemable_.typedschemable.md#refine)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:220*

___

### remoteData

• `Readonly` **remoteData**: \<A, B>(left: HKT\<S, A>, right: HKT\<S, B>) => HKT\<S, [RemoteData](../modules/_remotedata_remotedata_.md#remotedata)\<A, B>>

*Defined in [src/io/TypedSchemable.ts:30](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L30)*

___

### set

• `Readonly` **set**: \<A>(hkt: HKT\<S, A>) => HKT\<S, ReadonlySet\<A>>

*Defined in [src/io/TypedSchemable.ts:26](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L26)*

___

### string

• `Readonly` **string**: HKT\<S, string>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[string](_io_typedschemable_.typedschemable.md#string)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:22*

___

### sum

• `Readonly` **sum**: \<T>(tag: T) => \<A>(members: {}) => HKT\<S, A[keyof A]>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[sum](_io_typedschemable_.typedschemable.md#sum)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:56*

___

### symbol

• `Readonly` **symbol**: HKT\<S, symbol>

*Defined in [src/io/TypedSchemable.ts:37](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L37)*

___

### tuple

• `Readonly` **tuple**: \<A>(...components: {}) => HKT\<S, A>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[tuple](_io_typedschemable_.typedschemable.md#tuple)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:50*

___

### type

• `Readonly` **type**: \<A>(properties: {}) => HKT\<S, {}>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[type](_io_typedschemable_.typedschemable.md#type)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:26*

___

### union

• `Readonly` **union**: \<A>(...members: {}) => HKT\<S, A[number]>

*Inherited from [TypedSchemable](_io_typedschemable_.typedschemable.md).[union](_io_typedschemable_.typedschemable.md#union)*

*Defined in node_modules/io-ts/lib/Schemable.d.ts:190*

___

### unknown

• `Readonly` **unknown**: HKT\<S, unknown>

*Defined in [src/io/TypedSchemable.ts:35](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L35)*

___

### uuid

• `Readonly` **uuid**: HKT\<S, [Uuid](../modules/_uuid_common_.uuid.md)>

*Defined in [src/io/TypedSchemable.ts:32](https://github.com/TylorS/typed-fp/blob/f129829/src/io/TypedSchemable.ts#L32)*
