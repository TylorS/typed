**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/Include"

# Module: "common/Include"

## Index

### Type aliases

* [Include](_common_include_.md#include)

## Type aliases

### Include

Ƭ  **Include**\<A, B>: A *extends* B ? A : never

*Defined in [src/common/Include.ts:6](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/common/Include.ts#L6)*

Include only values of `A` that extend some type of `B`.

**`example`** 
Include<1 | 2 | 3, 2> === 2

#### Type parameters:

Name |
------ |
`A` |
`B` |
