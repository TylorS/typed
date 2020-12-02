**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/any"

# Module: "logic/any"

## Index

### Variables

* [any](_logic_any_.md#any)

### Functions

* [\_\_any](_logic_any_.md#__any)

## Variables

### any

• `Const` **any**: \<A>(predicate: Predicate\<A>, list: readonly A[]) => boolean\<A>(predicate: Predicate\<A>) => (list: readonly A[]) => boolean = curry(\_\_any) as { \<A>(predicate: Predicate\<A>, list: readonly A[]): boolean \<A>(predicate: Predicate\<A>): (list: readonly A[]) => boolean}

*Defined in [src/logic/any.ts:11](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/any.ts#L11)*

Returns true if any values in a list pass the given predicate.

**`param`** (a -> boolean)

**`param`** 

**`returns`** boolean

## Functions

### \_\_any

▸ **__any**\<A>(`predicate`: Predicate\<A>, `list`: readonly A[]): boolean

*Defined in [src/logic/any.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/any.ts#L19)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`list` | readonly A[] |

**Returns:** boolean
