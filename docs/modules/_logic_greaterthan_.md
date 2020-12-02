**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/greaterThan"

# Module: "logic/greaterThan"

## Index

### Variables

* [greaterThan](_logic_greaterthan_.md#greaterthan)

## Variables

### greaterThan

• `Const` **greaterThan**: \<A>(right: A, left: A) => boolean\<A>(right: A) => (left: A) => boolean = curry(\<A>(right: A, left: A) => left > right) as { \<A>(right: A, left: A): boolean \<A>(right: A): (left: A) => boolean}

*Defined in [src/logic/greaterThan.ts:9](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/greaterThan.ts#L9)*

Compares two values with >

**`param`** a

**`param`** b

**`returns`** boolean
