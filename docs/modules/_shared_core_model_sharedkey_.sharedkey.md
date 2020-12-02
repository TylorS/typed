**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/model/SharedKey"](_shared_core_model_sharedkey_.md) / SharedKey

# Namespace: SharedKey\<K>

A key used to index a Shared value.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`K` | PropertyKey | PropertyKey |

## Index

### Properties

* [\_A](_shared_core_model_sharedkey_.sharedkey.md#_a)
* [\_URI](_shared_core_model_sharedkey_.sharedkey.md#_uri)

### Variables

* [schema](_shared_core_model_sharedkey_.sharedkey.md#schema)
* [unwrap](_shared_core_model_sharedkey_.sharedkey.md#unwrap)
* [wrap](_shared_core_model_sharedkey_.sharedkey.md#wrap)

## Properties

### \_A

• `Readonly` **\_A**: K

*Inherited from [Uuid](_uuid_common_.uuid.md).[_A](_uuid_common_.uuid.md#_a)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:18*

___

### \_URI

• `Readonly` **\_URI**: \"SharedKey\"

*Inherited from [Uuid](_uuid_common_.uuid.md).[_URI](_uuid_common_.uuid.md#_uri)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:17*

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>> = createSchema((t) => t.newtype(t.propertyKey, flow(wrap, some), 'SharedKey'))

*Defined in [src/Shared/core/model/SharedKey.ts:14](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/model/SharedKey.ts#L14)*

___

### unwrap

•  **unwrap**: (s: S) => A

*Defined in [src/Shared/core/model/SharedKey.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/model/SharedKey.ts#L12)*

___

### wrap

•  **wrap**: (a: A) => S

*Defined in [src/Shared/core/model/SharedKey.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/model/SharedKey.ts#L12)*
