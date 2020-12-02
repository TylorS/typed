**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/cond"

# Module: "logic/cond"

## Index

### Type aliases

* [Conditional](_logic_cond_.md#conditional)

### Variables

* [cond](_logic_cond_.md#cond)

### Functions

* [\_\_cond](_logic_cond_.md#__cond)

## Type aliases

### Conditional

Ƭ  **Conditional**\<A, B>: [Predicate\<A>, (value: A) => B]

*Defined in [src/logic/cond.ts:37](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/cond.ts#L37)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

## Variables

### cond

• `Const` **cond**: \<A, B>(conditions: ReadonlyArray\<[Conditional](_logic_cond_.md#conditional)\<A, B>>, value: A) => Option\<B>\<A, B>(conditions: ReadonlyArray\<[Conditional](_logic_cond_.md#conditional)\<A, B>>) => (value: A) => Option\<B> = curry(\_\_cond) as { \<A, B>(conditions: ReadonlyArray\<Conditional\<A, B>>, value: A): Option\<B> \<A, B>(conditions: ReadonlyArray\<Conditional\<A, B>>): (value: A) => Option\<B>}

*Defined in [src/logic/cond.ts:11](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/cond.ts#L11)*

Basic pattern matching

**`param`** 

**`param`** a

**`returns`** Maybe b

## Functions

### \_\_cond

▸ **__cond**\<A, B>(`conditionals`: ReadonlyArray\<[Conditional](_logic_cond_.md#conditional)\<A, B>>, `value`: A): Option\<B>

*Defined in [src/logic/cond.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/cond.ts#L19)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`conditionals` | ReadonlyArray\<[Conditional](_logic_cond_.md#conditional)\<A, B>> |
`value` | A |

**Returns:** Option\<B>
