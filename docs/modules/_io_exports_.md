**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/exports"

# Module: "io/exports"

## Index

### References

* [JsonCodec](_io_exports_.md#jsoncodec)
* [JsonDecoder](_io_exports_.md#jsondecoder)
* [JsonEncoder](_io_exports_.md#jsonencoder)
* [Schemable2CE](_io_exports_.md#schemable2ce)
* [SchemableInterpreter](_io_exports_.md#schemableinterpreter)
* [TypeOf](_io_exports_.md#typeof)
* [TypedSchema](_io_exports_.md#typedschema)
* [TypedSchemable](_io_exports_.md#typedschemable)
* [TypedSchemable1](_io_exports_.md#typedschemable1)
* [TypedSchemable2C](_io_exports_.md#typedschemable2c)
* [createInterpreter](_io_exports_.md#createinterpreter)
* [createSchema](_io_exports_.md#createschema)

### Variables

* [createDecoderFromSchema](_io_exports_.md#createdecoderfromschema)
* [createEqFromSchema](_io_exports_.md#createeqfromschema)
* [createGuardFromSchema](_io_exports_.md#createguardfromschema)

## References

### JsonCodec

Re-exports: [JsonCodec](_io_jsoncodec_.md#jsoncodec)

___

### JsonDecoder

Re-exports: [JsonDecoder](_io_jsoncodec_.md#jsondecoder)

___

### JsonEncoder

Re-exports: [JsonEncoder](_io_jsoncodec_.md#jsonencoder)

___

### Schemable2CE

Re-exports: [Schemable2CE](_io_interpreter_.md#schemable2ce)

___

### SchemableInterpreter

Re-exports: [SchemableInterpreter](../interfaces/_io_interpreter_.schemableinterpreter.md)

___

### TypeOf

Re-exports: [TypeOf](_io_typedschema_.md#typeof)

___

### TypedSchema

Re-exports: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)

___

### TypedSchemable

Re-exports: [TypedSchemable](../interfaces/_io_typedschemable_.typedschemable.md)

___

### TypedSchemable1

Re-exports: [TypedSchemable1](../interfaces/_io_typedschemable_.typedschemable1.md)

___

### TypedSchemable2C

Re-exports: [TypedSchemable2C](../interfaces/_io_typedschemable_.typedschemable2c.md)

___

### createInterpreter

Re-exports: [createInterpreter](_io_interpreter_.md#createinterpreter)

___

### createSchema

Re-exports: [createSchema](_io_typedschema_.md#createschema)

## Variables

### createDecoderFromSchema

• `Const` **createDecoderFromSchema**: \<A>(schema: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>) => Kind2\<S, E, A> = createInterpreter(Decoder)

*Defined in [src/io/exports.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/exports.ts#L11)*

___

### createEqFromSchema

• `Const` **createEqFromSchema**: \<A>(schema: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>) => Kind\<S, A> = createInterpreter(Eq)

*Defined in [src/io/exports.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/exports.ts#L12)*

___

### createGuardFromSchema

• `Const` **createGuardFromSchema**: \<A>(schema: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<A>) => Kind\<S, A> = createInterpreter(Guard)

*Defined in [src/io/exports.ts:13](https://github.com/TylorS/typed-fp/blob/6ccb290/src/io/exports.ts#L13)*
