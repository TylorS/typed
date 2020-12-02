**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/propOr"

# Module: "logic/propOr"

## Index

### Variables

* [propOr](_logic_propor_.md#propor)

### Functions

* [\_\_propOr](_logic_propor_.md#__propor)

## Variables

### propOr

• `Const` **propOr**: \<A, K>(defaultValue: A, key: K, obj: {}) => A\<A, K>(defaultValue: A, key: K) => (obj: {}) => A\<A>(defaultValue: A) => \<K>(key: K, obj: {}) => A\<K>(key: K) => (obj: {}) => A = curry(\_\_propOr) as { \<A, K extends PropertyKey>(defaultValue: A, key: K, obj: { [Key in K]: A }): A \<A, K extends PropertyKey>(defaultValue: A, key: K): (obj: { [Key in K]: A }) => A \<A>(defaultValue: A): { \<K extends PropertyKey>(key: K, obj: { [Key in K]: A }): A \<K extends PropertyKey>(key: K): (obj: { [Key in K]: A }) => A }}

*Defined in [src/logic/propOr.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/logic/propOr.ts#L10)*

Get the value of a property if present or use default value.

**`param`** a

**`param`** PropertyKey

**`param`** 

**`returns`** a

## Functions

### \_\_propOr

▸ **__propOr**\<A, K>(`defaultValue`: A, `key`: K, `obj`: {}): A

*Defined in [src/logic/propOr.ts:26](https://github.com/TylorS/typed-fp/blob/6ccb290/src/logic/propOr.ts#L26)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`K` | PropertyKey |

#### Parameters:

Name | Type |
------ | ------ |
`defaultValue` | A |
`key` | K |
`obj` | {} |

**Returns:** A
