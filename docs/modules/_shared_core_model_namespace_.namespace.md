**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/model/Namespace"](_shared_core_model_namespace_.md) / Namespace

# Namespace: Namespace

A Namespace is a keyspace in which to store an isolated set of Shared keys to Shared values.

## Index

### Properties

* [\_A](_shared_core_model_namespace_.namespace.md#_a)
* [\_URI](_shared_core_model_namespace_.namespace.md#_uri)

### Variables

* [schema](_shared_core_model_namespace_.namespace.md#schema)
* [unwrap](_shared_core_model_namespace_.namespace.md#unwrap)
* [wrap](_shared_core_model_namespace_.namespace.md#wrap)

## Properties

### \_A

• `Readonly` **\_A**: PropertyKey

*Inherited from [Uuid](_uuid_common_.uuid.md).[_A](_uuid_common_.uuid.md#_a)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:18*

___

### \_URI

• `Readonly` **\_URI**: \"Namespace\"

*Inherited from [Uuid](_uuid_common_.uuid.md).[_URI](_uuid_common_.uuid.md#_uri)*

*Defined in node_modules/newtype-ts/lib/index.d.ts:17*

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[Namespace](_shared_core_model_namespace_.namespace.md)> = createSchema((t) => t.newtype(t.propertyKey, flow(wrap, some), 'Namespace'))

*Defined in [src/Shared/core/model/Namespace.ts:14](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Namespace.ts#L14)*

___

### unwrap

•  **unwrap**: (s: S) => A

*Defined in [src/Shared/core/model/Namespace.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Namespace.ts#L12)*

___

### wrap

•  **wrap**: (a: A) => S

*Defined in [src/Shared/core/model/Namespace.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Namespace.ts#L12)*
