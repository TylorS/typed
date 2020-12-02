**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/greaterThanOrEqual"

# Module: "logic/greaterThanOrEqual"

## Index

### Variables

* [greaterThanOrEqual](_logic_greaterthanorequal_.md#greaterthanorequal)

## Variables

### greaterThanOrEqual

• `Const` **greaterThanOrEqual**: \<A>(right: A, left: A) => boolean\<A>(right: A) => (left: A) => boolean = curry(\<A>(right: A, left: A) => left >= right) as { \<A>(right: A, left: A): boolean \<A>(right: A): (left: A) => boolean}

*Defined in [src/logic/greaterThanOrEqual.ts:9](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/logic/greaterThanOrEqual.ts#L9)*

Compares two values with >=

**`param`** a

**`param`** b

**`returns`** boolean
