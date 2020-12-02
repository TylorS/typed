**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/types"

# Module: "logic/types"

## Index

### Namespaces

* [Match](_logic_types_.match.md)

### Type aliases

* [Is](_logic_types_.md#is)
* [IsNot](_logic_types_.md#isnot)

## Type aliases

### Is

Ƭ  **Is**\<A>: (value: unknown) => value is A

*Defined in [src/logic/types.ts:9](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/types.ts#L9)*

Check if a value is a given type

#### Type parameters:

Name |
------ |
`A` |

___

### IsNot

Ƭ  **IsNot**\<A>: \<B>(value: A \| B) => value is B

*Defined in [src/logic/types.ts:14](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/types.ts#L14)*

Check that value is not a given type

#### Type parameters:

Name |
------ |
`A` |
