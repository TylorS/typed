**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/is"

# Module: "logic/is"

## Index

### Variables

* [isBoolean](_logic_is_.md#isboolean)
* [isFalse](_logic_is_.md#isfalse)
* [isJson](_logic_is_.md#isjson)
* [isJsonPrimitive](_logic_is_.md#isjsonprimitive)
* [isNotArray](_logic_is_.md#isnotarray)
* [isNotArrayLike](_logic_is_.md#isnotarraylike)
* [isNotBoolean](_logic_is_.md#isnotboolean)
* [isNotDate](_logic_is_.md#isnotdate)
* [isNotFalse](_logic_is_.md#isnotfalse)
* [isNotFunction](_logic_is_.md#isnotfunction)
* [isNotGenerator](_logic_is_.md#isnotgenerator)
* [isNotIterable](_logic_is_.md#isnotiterable)
* [isNotIterator](_logic_is_.md#isnotiterator)
* [isNotJson](_logic_is_.md#isnotjson)
* [isNotJsonArray](_logic_is_.md#isnotjsonarray)
* [isNotJsonPrimitive](_logic_is_.md#isnotjsonprimitive)
* [isNotJsonRecord](_logic_is_.md#isnotjsonrecord)
* [isNotMap](_logic_is_.md#isnotmap)
* [isNotNull](_logic_is_.md#isnotnull)
* [isNotNumber](_logic_is_.md#isnotnumber)
* [isNotPromiseLie](_logic_is_.md#isnotpromiselie)
* [isNotRecord](_logic_is_.md#isnotrecord)
* [isNotSet](_logic_is_.md#isnotset)
* [isNotString](_logic_is_.md#isnotstring)
* [isNotTrue](_logic_is_.md#isnottrue)
* [isNotUndefined](_logic_is_.md#isnotundefined)
* [isNull](_logic_is_.md#isnull)
* [isTrue](_logic_is_.md#istrue)
* [isUndefined](_logic_is_.md#isundefined)

### Functions

* [is](_logic_is_.md#is)
* [isAndIsNot](_logic_is_.md#isandisnot)
* [isArray](_logic_is_.md#isarray)
* [isArrayLike](_logic_is_.md#isarraylike)
* [isDate](_logic_is_.md#isdate)
* [isFunction](_logic_is_.md#isfunction)
* [isGenerator](_logic_is_.md#isgenerator)
* [isIterable](_logic_is_.md#isiterable)
* [isIterator](_logic_is_.md#isiterator)
* [isJsonArray](_logic_is_.md#isjsonarray)
* [isJsonRecord](_logic_is_.md#isjsonrecord)
* [isMap](_logic_is_.md#ismap)
* [isNot](_logic_is_.md#isnot)
* [isNumber](_logic_is_.md#isnumber)
* [isPromiseLike](_logic_is_.md#ispromiselike)
* [isRecord](_logic_is_.md#isrecord)
* [isSet](_logic_is_.md#isset)
* [isString](_logic_is_.md#isstring)

## Variables

### isBoolean

• `Const` **isBoolean**: [Is](_logic_types_.md#is)\<boolean> = or(isTrue, isFalse)

*Defined in [src/logic/is.ts:207](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L207)*

Check if a value is or is not boolean

___

### isFalse

•  **isFalse**: [Is](_logic_types_.md#is)\<false>

*Defined in [src/logic/is.ts:200](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L200)*

___

### isJson

• `Const` **isJson**: [Is](_logic_types_.md#is)\<Json> = or(isJsonPrimitive, or(isJsonArray, isJsonRecord))

*Defined in [src/logic/is.ts:249](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L249)*

Check if a value is Json

___

### isJsonPrimitive

• `Const` **isJsonPrimitive**: [Is](_logic_types_.md#is)\<[JsonPrimitive](_logic_json_.md#jsonprimitive)> = or(isString, or(isNumber, or(isBoolean, isNull)))

*Defined in [src/logic/is.ts:239](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L239)*

Check if a value is a Json primitive

___

### isNotArray

• `Const` **isNotArray**: [IsNot](_logic_types_.md#isnot)\<ReadonlyArray\<unknown>> = complement(isArray)

*Defined in [src/logic/is.ts:68](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L68)*

Check if a value is not an Array

___

### isNotArrayLike

• `Const` **isNotArrayLike**: [IsNot](_logic_types_.md#isnot)\<ArrayLike\<unknown>> = complement(isArrayLike)

*Defined in [src/logic/is.ts:144](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L144)*

Check if a value is not a ArrayLike

___

### isNotBoolean

• `Const` **isNotBoolean**: [IsNot](_logic_types_.md#isnot)\<boolean> = complement(isBoolean)

*Defined in [src/logic/is.ts:208](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L208)*

___

### isNotDate

• `Const` **isNotDate**: [IsNot](_logic_types_.md#isnot)\<Date> = complement(isDate)

*Defined in [src/logic/is.ts:264](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L264)*

Check if a value is not a Date

___

### isNotFalse

•  **isNotFalse**: [IsNot](_logic_types_.md#isnot)\<false>

*Defined in [src/logic/is.ts:200](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L200)*

___

### isNotFunction

• `Const` **isNotFunction**: [IsNot](_logic_types_.md#isnot)\<Function> = complement(isFunction)

*Defined in [src/logic/is.ts:32](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L32)*

Check if a value is not a function.

___

### isNotGenerator

• `Const` **isNotGenerator**: [IsNot](_logic_types_.md#isnot)\<Generator\<unknown, unknown, unknown>> = complement(isGenerator)

*Defined in [src/logic/is.ts:111](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L111)*

Check if a value is not a Generator

___

### isNotIterable

• `Const` **isNotIterable**: [IsNot](_logic_types_.md#isnot)\<Iterable\<unknown>> = complement(isIterable)

*Defined in [src/logic/is.ts:92](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L92)*

Check if a value is not an interable

___

### isNotIterator

• `Const` **isNotIterator**: [IsNot](_logic_types_.md#isnot)\<Iterator\<unknown>> = complement(isIterable)

*Defined in [src/logic/is.ts:80](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L80)*

Check if a value is not an Iterator

___

### isNotJson

• `Const` **isNotJson**: [IsNot](_logic_types_.md#isnot)\<Json> = complement(isJson)

*Defined in [src/logic/is.ts:254](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L254)*

Check if a value is not Json

___

### isNotJsonArray

• `Const` **isNotJsonArray**: [IsNot](_logic_types_.md#isnot)\<JsonArray> = complement(isJsonArray)

*Defined in [src/logic/is.ts:220](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L220)*

Check if a value is not a JsonArray

___

### isNotJsonPrimitive

• `Const` **isNotJsonPrimitive**: [IsNot](_logic_types_.md#isnot)\<[JsonPrimitive](_logic_json_.md#jsonprimitive)> = complement(isJsonPrimitive)

*Defined in [src/logic/is.ts:244](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L244)*

Check if a value is not a Json primitive

___

### isNotJsonRecord

• `Const` **isNotJsonRecord**: [IsNot](_logic_types_.md#isnot)\<JsonRecord> = complement(isJsonRecord)

*Defined in [src/logic/is.ts:234](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L234)*

Check if a value is not a JsonRecord

___

### isNotMap

• `Const` **isNotMap**: [IsNot](_logic_types_.md#isnot)\<[Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<unknown, unknown>> = complement(isMap)

*Defined in [src/logic/is.ts:37](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L37)*

Check if a value is not a Map

___

### isNotNull

•  **isNotNull**: [IsNot](_logic_types_.md#isnot)\<null>

*Defined in [src/logic/is.ts:54](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L54)*

___

### isNotNumber

• `Const` **isNotNumber**: [IsNot](_logic_types_.md#isnot)\<number> = complement(isNumber)

*Defined in [src/logic/is.ts:154](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L154)*

Check if a value is not a number

___

### isNotPromiseLie

• `Const` **isNotPromiseLie**: [IsNot](_logic_types_.md#isnot)\<PromiseLike\<unknown>> = complement(isPromiseLike)

*Defined in [src/logic/is.ts:188](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L188)*

Check if a value is not PromiseLike

___

### isNotRecord

• `Const` **isNotRecord**: [IsNot](_logic_types_.md#isnot)\<Readonly\<Record\<PropertyKey, unknown>>> = complement(isRecord)

*Defined in [src/logic/is.ts:177](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L177)*

Check if a value is not a Record

___

### isNotSet

• `Const` **isNotSet**: [IsNot](_logic_types_.md#isnot)\<Set\<unknown>> = complement(isSet)

*Defined in [src/logic/is.ts:42](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L42)*

Check if a value is not a Set

___

### isNotString

• `Const` **isNotString**: [IsNot](_logic_types_.md#isnot)\<string> = complement(isString)

*Defined in [src/logic/is.ts:164](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L164)*

Check if a value is not a string

___

### isNotTrue

•  **isNotTrue**: [IsNot](_logic_types_.md#isnot)\<true>

*Defined in [src/logic/is.ts:193](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L193)*

___

### isNotUndefined

•  **isNotUndefined**: [IsNot](_logic_types_.md#isnot)\<undefined>

*Defined in [src/logic/is.ts:47](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L47)*

___

### isNull

•  **isNull**: [Is](_logic_types_.md#is)\<null>

*Defined in [src/logic/is.ts:54](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L54)*

___

### isTrue

•  **isTrue**: [Is](_logic_types_.md#is)\<true>

*Defined in [src/logic/is.ts:193](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L193)*

___

### isUndefined

•  **isUndefined**: [Is](_logic_types_.md#is)\<undefined>

*Defined in [src/logic/is.ts:47](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L47)*

## Functions

### is

▸ `Const`**is**\<A>(`value`: A): [Is](_logic_types_.md#is)\<A>

*Defined in [src/logic/is.ts:16](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L16)*

Create a function for checking if something is equal to a given value.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** [Is](_logic_types_.md#is)\<A>

___

### isAndIsNot

▸ `Const`**isAndIsNot**\<A>(`value`: A): readonly [[Is](_logic_types_.md#is)\<A>, [IsNot](_logic_types_.md#isnot)\<A>]

*Defined in [src/logic/is.ts:26](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L26)*

Create both Is<A> and IsNot<A> instances for a value.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |

**Returns:** readonly [[Is](_logic_types_.md#is)\<A>, [IsNot](_logic_types_.md#isnot)\<A>]

___

### isArray

▸ **isArray**(`x`: unknown): x is unknown[]

*Defined in [src/logic/is.ts:61](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L61)*

Check if a value is an Array

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is unknown[]

___

### isArrayLike

▸ `Const`**isArrayLike**(`x`: unknown): x is ArrayLike\<unknown>

*Defined in [src/logic/is.ts:116](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L116)*

Check if a value is a ArrayLike

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is ArrayLike\<unknown>

___

### isDate

▸ `Const`**isDate**(`u`: unknown): u is Date

*Defined in [src/logic/is.ts:259](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L259)*

Check if a value is a Date

#### Parameters:

Name | Type |
------ | ------ |
`u` | unknown |

**Returns:** u is Date

___

### isFunction

▸ **isFunction**(`x`: any): x is Function

*Defined in [src/logic/is.ts:308](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L308)*

Check if a value is a Function

#### Parameters:

Name | Type |
------ | ------ |
`x` | any |

**Returns:** x is Function

___

### isGenerator

▸ `Const`**isGenerator**(`x`: unknown): x is Generator\<unknown, unknown, unknown>

*Defined in [src/logic/is.ts:97](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L97)*

Check if a value is a Generator

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is Generator\<unknown, unknown, unknown>

___

### isIterable

▸ **isIterable**(`x`: unknown): x is Iterable\<unknown>

*Defined in [src/logic/is.ts:85](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L85)*

Check if a value is an interable

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is Iterable\<unknown>

___

### isIterator

▸ **isIterator**(`x`: unknown): x is Iterator\<unknown>

*Defined in [src/logic/is.ts:73](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L73)*

Check if a value is an Iterator

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is Iterator\<unknown>

___

### isJsonArray

▸ `Const`**isJsonArray**(`x`: unknown): x is JsonArray

*Defined in [src/logic/is.ts:213](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L213)*

Check if a value is a JsonArray

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is JsonArray

___

### isJsonRecord

▸ `Const`**isJsonRecord**(`x`: unknown): x is JsonRecord

*Defined in [src/logic/is.ts:225](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L225)*

Check if a value is a JsonRecord

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is JsonRecord

___

### isMap

▸ **isMap**\<A, B>(`x`: any): x is Map\<A, B>

*Defined in [src/logic/is.ts:269](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L269)*

Check if a value is a Map

#### Type parameters:

Name | Default |
------ | ------ |
`A` | unknown |
`B` | unknown |

#### Parameters:

Name | Type |
------ | ------ |
`x` | any |

**Returns:** x is Map\<A, B>

___

### isNot

▸ `Const`**isNot**\<A>(`a`: A): [IsNot](_logic_types_.md#isnot)\<A>

*Defined in [src/logic/is.ts:21](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L21)*

Create a function for checking if something is not equal to a given value.

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |

**Returns:** [IsNot](_logic_types_.md#isnot)\<A>

___

### isNumber

▸ `Const`**isNumber**(`u`: unknown): u is number

*Defined in [src/logic/is.ts:149](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L149)*

Check if a value is a number

#### Parameters:

Name | Type |
------ | ------ |
`u` | unknown |

**Returns:** u is number

___

### isPromiseLike

▸ `Const`**isPromiseLike**(`x`: unknown): x is PromiseLike\<unknown>

*Defined in [src/logic/is.ts:182](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L182)*

Check if a value is not a PromiseLike

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** x is PromiseLike\<unknown>

___

### isRecord

▸ `Const`**isRecord**(`u`: unknown): u is Readonly\<Record\<PropertyKey, unknown>>

*Defined in [src/logic/is.ts:169](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L169)*

Check if a value is a Record

#### Parameters:

Name | Type |
------ | ------ |
`u` | unknown |

**Returns:** u is Readonly\<Record\<PropertyKey, unknown>>

___

### isSet

▸ **isSet**\<A>(`x`: any): x is Set\<A>

*Defined in [src/logic/is.ts:289](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L289)*

Check if a value is a Set

#### Type parameters:

Name | Default |
------ | ------ |
`A` | any |

#### Parameters:

Name | Type |
------ | ------ |
`x` | any |

**Returns:** x is Set\<A>

___

### isString

▸ `Const`**isString**(`u`: unknown): u is string

*Defined in [src/logic/is.ts:159](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/is.ts#L159)*

Check if a value is a string

#### Parameters:

Name | Type |
------ | ------ |
`u` | unknown |

**Returns:** u is string
