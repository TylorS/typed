**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/all"

# Module: "logic/all"

## Index

### Variables

* [all](_logic_all_.md#all)

### Functions

* [\_\_all](_logic_all_.md#__all)

## Variables

### all

• `Const` **all**: \<A>(predicate: Predicate\<A>, value: ReadonlyArray\<A>) => boolean\<A>(predicate: Predicate\<A>) => Predicate\<ReadonlyArray\<A>> = curry(\_\_all)

*Defined in [src/logic/all.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/all.ts#L12)*

Returns true if all values in a list match a predicate, false otherwise.

**`param`** (a -> boolean)

**`param`** 

**`returns`** boolean

## Functions

### \_\_all

▸ **__all**\<A>(`predicate`: Predicate\<A>, `list`: ReadonlyArray\<A>): boolean

*Defined in [src/logic/all.ts:17](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/all.ts#L17)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`list` | ReadonlyArray\<A> |

**Returns:** boolean
