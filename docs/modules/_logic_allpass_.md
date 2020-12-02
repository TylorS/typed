**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/allPass"

# Module: "logic/allPass"

## Index

### Variables

* [allPass](_logic_allpass_.md#allpass)

### Functions

* [\_\_allPass](_logic_allpass_.md#__allpass)

## Variables

### allPass

• `Const` **allPass**: \<A>(predicates: ReadonlyArray\<Predicate\<A>>, value: A) => boolean\<A>(predicates: ReadonlyArray\<Predicate\<A>>) => Predicate\<A> = curry(\_\_allPass) as { \<A>(predicates: ReadonlyArray\<Predicate\<A>>, value: A): boolean \<A>(predicates: ReadonlyArray\<Predicate\<A>>): Predicate\<A>}

*Defined in [src/logic/allPass.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/allPass.ts#L12)*

Returns true if value matches a list of predicates.

**`param`** 

**`param`** a

**`returns`** boolean

## Functions

### \_\_allPass

▸ **__allPass**\<A>(`predicates`: ReadonlyArray\<Predicate\<A>>, `value`: A): boolean

*Defined in [src/logic/allPass.ts:20](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/allPass.ts#L20)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`predicates` | ReadonlyArray\<Predicate\<A>> |
`value` | A |

**Returns:** boolean
