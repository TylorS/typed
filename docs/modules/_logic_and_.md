**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/and"

# Module: "logic/and"

## Index

### Variables

* [and](_logic_and_.md#and)

### Functions

* [\_\_and](_logic_and_.md#__and)

## Variables

### and

• `Const` **and**: \<A, B>(predicate1: [Is](_logic_types_.md#is)\<A>, predicate2: [Is](_logic_types_.md#is)\<B>, value: unknown) => value is A & B\<A, B>(predicate1: [Is](_logic_types_.md#is)\<A>, predicate2: [Is](_logic_types_.md#is)\<B>) => (value: unknown) => value is A & B\<A>(predicate1: [Is](_logic_types_.md#is)\<A>) => \<B>(predicate2: [Is](_logic_types_.md#is)\<B>, value: unknown) => value is A & B\<B>(predicate2: [Is](_logic_types_.md#is)\<B>) => (value: unknown) => value is A & B\<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>, value: A) => boolean\<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>) => Predicate\<A>\<A>(predicate1: Predicate\<A>) => (predicate2: Predicate\<A>, value: A) => boolean(predicate2: Predicate\<A>) => Predicate\<A> = curry(\_\_and) as { \<C, A extends C, B extends C>(predicate1: Is\<A>, predicate2: Is\<B>, value: C): value is A & B \<C, A extends C, B extends C>(predicate1: Is\<A>, predicate2: Is\<B>): (value: C) => value is A & B \<C, A extends C>(predicate1: Is\<A>): { \<B extends C>(predicate2: Is\<B>, value: C): value is A & B \<B extends C>(predicate2: Is\<B>): (value: C) => value is A & B } \<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>, value: A): boolean \<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>): Predicate\<A> \<A>(predicate1: Predicate\<A>): { (predicate2: Predicate\<A>, value: A): boolean (predicate2: Predicate\<A>): Predicate\<A> }}

*Defined in [src/logic/and.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/and.ts#L13)*

Returns true if both predicates return true.

**`param`** (a -> boolean)

**`param`** (a -> boolean)

**`param`** a

**`returns`** boolean

## Functions

### \_\_and

▸ **__and**\<A>(`predicate1`: Predicate\<A>, `predicate2`: Predicate\<A>, `value`: A): boolean

*Defined in [src/logic/and.ts:43](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/and.ts#L43)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate1` | Predicate\<A> |
`predicate2` | Predicate\<A> |
`value` | A |

**Returns:** boolean
