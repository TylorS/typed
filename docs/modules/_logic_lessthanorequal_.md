**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/lessThanOrEqual"

# Module: "logic/lessThanOrEqual"

## Index

### Variables

* [lessThanOrEqual](_logic_lessthanorequal_.md#lessthanorequal)

## Variables

### lessThanOrEqual

• `Const` **lessThanOrEqual**: \<A>(right: A, left: A) => boolean\<A>(right: A) => (left: A) => boolean = curry(\<A>(right: A, left: A) => left \<= right) as { \<A>(right: A, left: A): boolean \<A>(right: A): (left: A) => boolean}

*Defined in [src/logic/lessThanOrEqual.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/lessThanOrEqual.ts#L9)*

Compare two values using <=

**`param`** a

**`param`** a

**`returns`** boolean
