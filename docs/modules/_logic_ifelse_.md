**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/ifElse"

# Module: "logic/ifElse"

## Index

### Interfaces

* [IfElseFn](../interfaces/_logic_ifelse_.ifelsefn.md)

### Variables

* [ifElse](_logic_ifelse_.md#ifelse)

### Functions

* [\_\_ifElse](_logic_ifelse_.md#__ifelse)

## Variables

### ifElse

• `Const` **ifElse**: [IfElseFn](../interfaces/_logic_ifelse_.ifelsefn.md) = curry(\_\_ifElse) as IfElseFn

*Defined in [src/logic/ifElse.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/ifElse.ts#L14)*

If-else statement for functions.

**`param`** (a -> boolean)

**`param`** (a -> b)

**`param`** (a -> b)

**`param`** a

**`returns`** b

## Functions

### \_\_ifElse

▸ **__ifElse**\<A, B>(`predicate`: Predicate\<A>, `thenFn`: [Arity1](_common_types_.md#arity1)\<A, B>, `elseFn`: [Arity1](_common_types_.md#arity1)\<A, B>, `value`: A): B

*Defined in [src/logic/ifElse.ts:16](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/ifElse.ts#L16)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`predicate` | Predicate\<A> |
`thenFn` | [Arity1](_common_types_.md#arity1)\<A, B> |
`elseFn` | [Arity1](_common_types_.md#arity1)\<A, B> |
`value` | A |

**Returns:** B
