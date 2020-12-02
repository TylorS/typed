**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Key/exports"](../modules/_key_exports_.md) / Key

# Interface: Key\<A>

A Newtype for representing Keys for a given type.

**`example`** 
type FooKey = Key<Foo>
type Foo = { id: FooKey, ... }

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* Newtype\<Const\<A, [KeyBrand](../modules/_key_exports_.md#keybrand)>, string>

  ↳ **Key**

## Index

### Properties

* [\_A](_key_exports_.key.md#_a)
* [\_URI](_key_exports_.key.md#_uri)

## Properties

### \_A

• `Readonly` **\_A**: string

*Inherited from [Uuid](../modules/_uuid_common_.uuid.md).[_A](../modules/_uuid_common_.uuid.md#_a)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:18*

___

### \_URI

• `Readonly` **\_URI**: Const\<A, [KeyBrand](../modules/_key_exports_.md#keybrand)>

*Inherited from [Uuid](../modules/_uuid_common_.uuid.md).[_URI](../modules/_uuid_common_.uuid.md#_uri)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:17*
