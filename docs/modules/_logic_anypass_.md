**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/anyPass"

# Module: "logic/anyPass"

## Index

### Variables

* [anyPass](_logic_anypass_.md#anypass)

### Functions

* [\_\_anyPass](_logic_anypass_.md#__anypass)

## Variables

### anyPass

• `Const` **anyPass**: \<A>(predicates: ReadonlyArray\<Predicate\<A>>, value: A) => boolean\<A>(predicates: ReadonlyArray\<Predicate\<A>>) => (value: A) => boolean = curry(\_\_anyPass) as { \<A>(predicates: ReadonlyArray\<Predicate\<A>>, value: A): boolean \<A>(predicates: ReadonlyArray\<Predicate\<A>>): (value: A) => boolean}

*Defined in [src/logic/anyPass.ts:10](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/anyPass.ts#L10)*

Returns true if value matches any predicates

**`param`** 

**`param`** a

**`returns`** boolean

## Functions

### \_\_anyPass

▸ **__anyPass**\<A>(`predicates`: ReadonlyArray\<Predicate\<A>>, `value`: A): boolean

*Defined in [src/logic/anyPass.ts:18](https://github.com/TylorS/typed-fp/blob/559f273/src/logic/anyPass.ts#L18)*

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
