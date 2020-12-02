**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/And"

# Module: "common/And"

## Index

### Type aliases

* [And](_common_and_.md#and)

## Type aliases

### And

Ƭ  **And**\<A, R>: A *extends* readonly [*infer* T] ? And\<Rest, R & T> : A *extends* readonly [*infer* T] ? R & T : R

*Defined in [src/common/And.ts:9](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/common/And.ts#L9)*

Convert a n-ary tuple of values into an intersection of all of those values. If
the tuple is empty the fallback value, defaulting to `unknown`, will be used.

**`example`** 
And<[{ a: 1 }, { b: 2 }]> = { a: 1 } & { b: 2 }
And<[]> = unknown
And<[], { foo: string }> = { foo: string }

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`A` | ReadonlyArray\<any> | - |
`R` | - | unknown |
