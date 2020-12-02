**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/interpreter"

# Module: "io/interpreter"

## Index

### Interfaces

* [SchemableInterpreter](../interfaces/_io_interpreter_.schemableinterpreter.md)

### Type aliases

* [Schemable2CE](_io_interpreter_.md#schemable2ce)

### Functions

* [createInterpreter](_io_interpreter_.md#createinterpreter)

## Type aliases

### Schemable2CE

Ƭ  **Schemable2CE**\<S>: S *extends* Schemable2C\<any, *infer* R> ? R : never

*Defined in [src/io/interpreter.ts:24](https://github.com/TylorS/typed-fp/blob/559f273/src/io/interpreter.ts#L24)*

#### Type parameters:

Name |
------ |
`S` |

## Functions

### createInterpreter

▸ `Const`**createInterpreter**(`s`: any): (Anonymous function)

*Defined in [src/io/interpreter.ts:22](https://github.com/TylorS/typed-fp/blob/559f273/src/io/interpreter.ts#L22)*

Create an interpreter from a Schemable instance

#### Parameters:

Name | Type |
------ | ------ |
`s` | any |

**Returns:** (Anonymous function)
