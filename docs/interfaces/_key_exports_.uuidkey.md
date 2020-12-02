**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Key/exports"](../modules/_key_exports_.md) / UuidKey

# Interface: UuidKey\<A>

A Newtype for representing Keys that are Uuids for a given type.

**`example`** 
type FooKey = UuidKey<Foo>
type Foo = { id: FooKey, ... }

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* Newtype\<Const\<A, [KeyBrand](../modules/_key_exports_.md#keybrand)>, [Uuid](../modules/_uuid_common_.uuid.md)>

  ↳ **UuidKey**

## Index

### Properties

* [\_A](_key_exports_.uuidkey.md#_a)
* [\_URI](_key_exports_.uuidkey.md#_uri)

## Properties

### \_A

• `Readonly` **\_A**: [Uuid](../modules/_uuid_common_.uuid.md)

*Inherited from [Uuid](../modules/_uuid_common_.uuid.md).[_A](../modules/_uuid_common_.uuid.md#_a)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:18*

___

### \_URI

• `Readonly` **\_URI**: Const\<A, [KeyBrand](../modules/_key_exports_.md#keybrand)>

*Inherited from [Uuid](../modules/_uuid_common_.uuid.md).[_URI](../modules/_uuid_common_.uuid.md#_uri)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:17*
