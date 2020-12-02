**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "io/JsonCodec"

# Module: "io/JsonCodec"

## Index

### Variables

* [JsonCodec](_io_jsoncodec_.md#jsoncodec)
* [JsonDecoder](_io_jsoncodec_.md#jsondecoder)

### Object literals

* [JsonEncoder](_io_jsoncodec_.md#jsonencoder)

## Variables

### JsonCodec

• `Const` **JsonCodec**: Codec\<string, string, [JsonSerializable](_logic_json_.md#jsonserializable)> = make(JsonDecoder, JsonEncoder)

*Defined in [src/io/JsonCodec.ts:24](https://github.com/TylorS/typed-fp/blob/f129829/src/io/JsonCodec.ts#L24)*

A codec between JSON-strings and JsonSerializable values.

___

### JsonDecoder

• `Const` **JsonDecoder**: Decoder\<string, [JsonSerializable](_logic_json_.md#jsonserializable)> = pipe(Schemable.string, map(fromJson))

*Defined in [src/io/JsonCodec.ts:19](https://github.com/TylorS/typed-fp/blob/f129829/src/io/JsonCodec.ts#L19)*

Decode an encoded JsonSerializable value.

## Object literals

### JsonEncoder

▪ `Const` **JsonEncoder**: object

*Defined in [src/io/JsonCodec.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/io/JsonCodec.ts#L12)*

Encode JsonSerializable values into a JSON-string

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`encode` | [toJson](_logic_json_.md#tojson) | toJson |
