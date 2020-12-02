**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/equals"

# Module: "logic/equals"

## Index

### Variables

* [equals](_logic_equals_.md#equals)

## Variables

### equals

• `Const` **equals**: \<A>(a: A, b: A) => boolean\<A>(a: A) => (b: A) => boolean = curry(\<A>(a: A, b: A): boolean => deepEqualsEq.equals(a, b)) as { \<A>(a: A, b: A): boolean \<A>(a: A): (b: A) => boolean}

*Defined in [src/logic/equals.ts:7](https://github.com/TylorS/typed-fp/blob/f129829/src/logic/equals.ts#L7)*

Deep Equality check of 2 values.
