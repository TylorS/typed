**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/or"

# Module: "logic/or"

## Index

### Variables

* [or](_logic_or_.md#or)

### Functions

* [\_\_or](_logic_or_.md#__or)

## Variables

### or

• `Const` **or**: \<A, B>(predicate1: [Is](_logic_types_.md#is)\<A>, predicate2: [Is](_logic_types_.md#is)\<B>, value: unknown) => value is A \| B\<A, B>(predicate1: [Is](_logic_types_.md#is)\<A>, predicate2: [Is](_logic_types_.md#is)\<B>) => (value: unknown) => value is A \| B\<A>(predicate1: [Is](_logic_types_.md#is)\<A>) => \<B>(predicate2: [Is](_logic_types_.md#is)\<B>, value: unknown) => value is A \| B\<B>(predicate2: [Is](_logic_types_.md#is)\<B>) => [Is](_logic_types_.md#is)\<A \| B>\<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>, value: A) => boolean\<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>) => Predicate\<A>\<A>(predicate1: Predicate\<A>) => (predicate2: Predicate\<A>, value: A) => boolean(predicate2: Predicate\<A>) => Predicate\<A> = curry(\_\_or) as { \<C, A extends C, B extends C>(predicate1: Is\<A>, predicate2: Is\<B>, value: C): value is A \| B \<C, A extends C, B extends C>(predicate1: Is\<A>, predicate2: Is\<B>): (value: C) => value is A \| B \<C, A extends C>(predicate1: Is\<A>): { \<B extends C>(predicate2: Is\<B>, value: C): value is A \| B \<B extends C>(predicate2: Is\<B>): (value: C) => value is A \| B } \<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>, value: A): boolean \<A>(predicate1: Predicate\<A>, predicate2: Predicate\<A>): Predicate\<A> \<A>(predicate1: Predicate\<A>): { (predicate2: Predicate\<A>, value: A): boolean (predicate2: Predicate\<A>): Predicate\<A> }}

*Defined in [src/logic/or.ts:13](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/or.ts#L13)*

Returns true if either predicates return true.

**`param`** (a -> boolean)

**`param`** (a -> boolean)

**`param`** a

**`returns`** boolean

## Functions

### \_\_or

▸ **__or**\<A>(`predicate1`: Predicate\<A>, `predicate2`: Predicate\<A>, `value`: A): boolean

*Defined in [src/logic/or.ts:43](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/or.ts#L43)*

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
