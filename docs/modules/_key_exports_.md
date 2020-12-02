**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Key/exports"

# Module: "Key/exports"

## Index

### Interfaces

* [Key](../interfaces/_key_exports_.key.md)
* [KeyIso](../interfaces/_key_exports_.keyiso.md)
* [UuidKey](../interfaces/_key_exports_.uuidkey.md)
* [UuidKeyIso](../interfaces/_key_exports_.uuidkeyiso.md)

### Type aliases

* [KeyBrand](_key_exports_.md#keybrand)
* [KeyFor](_key_exports_.md#keyfor)

### Functions

* [getKeyIso](_key_exports_.md#getkeyiso)
* [getUuidKeyIso](_key_exports_.md#getuuidkeyiso)

## Type aliases

### KeyBrand

Ƭ  **KeyBrand**: \"Key\"

*Defined in [src/Key/exports.ts:42](https://github.com/TylorS/typed-fp/blob/f129829/src/Key/exports.ts#L42)*

___

### KeyFor

Ƭ  **KeyFor**\<A>: A *extends* Newtype\<Const\<*infer* R, any>, any> ? R : never

*Defined in [src/Key/exports.ts:47](https://github.com/TylorS/typed-fp/blob/f129829/src/Key/exports.ts#L47)*

Retrieve the value a given Key is For

#### Type parameters:

Name |
------ |
`A` |

## Functions

### getKeyIso

▸ `Const`**getKeyIso**\<A>(): [KeyIso](../interfaces/_key_exports_.keyiso.md)\<A>

*Defined in [src/Key/exports.ts:22](https://github.com/TylorS/typed-fp/blob/f129829/src/Key/exports.ts#L22)*

Create an KeyIso<A>

#### Type parameters:

Name |
------ |
`A` |

**Returns:** [KeyIso](../interfaces/_key_exports_.keyiso.md)\<A>

___

### getUuidKeyIso

▸ `Const`**getUuidKeyIso**\<A>(): [UuidKeyIso](../interfaces/_key_exports_.uuidkeyiso.md)\<A>

*Defined in [src/Key/exports.ts:40](https://github.com/TylorS/typed-fp/blob/f129829/src/Key/exports.ts#L40)*

Create a UuidKeyIso<A>

#### Type parameters:

Name |
------ |
`A` |

**Returns:** [UuidKeyIso](../interfaces/_key_exports_.uuidkeyiso.md)\<A>
