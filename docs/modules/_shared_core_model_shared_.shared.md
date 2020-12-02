**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/model/Shared"](_shared_core_model_shared_.md) / Shared

# Namespace: Shared\<K, E, A>

A Shared instance is a Effect-based abstraction for key-value pairs with lifecycle
events and optional namespacing.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`K` | [SharedKey](_shared_core_model_sharedkey_.sharedkey.md) | SharedKey |
`E` | - | any |
`A` | - | any |

## Hierarchy

* **Shared**

  ↳ [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)

  ↳ [SharedSet](../interfaces/_shared_set_sharedset_.sharedset.md)

## Index

### Properties

* [eq](_shared_core_model_shared_.shared.md#eq)
* [initial](_shared_core_model_shared_.shared.md#initial)
* [key](_shared_core_model_shared_.shared.md#key)

### Variables

* [schema](_shared_core_model_shared_.shared.md#schema)

## Properties

### eq

• `Readonly` **eq**: Eq\<A>

*Defined in [src/Shared/core/model/Shared.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L17)*

___

### initial

• `Readonly` **initial**: [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Shared/core/model/Shared.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L16)*

___

### key

• `Readonly` **key**: K

*Defined in [src/Shared/core/model/Shared.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L15)*

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>> = createSchema\<Shared>((t) => t.type({ key: t.newtype(t.propertyKey, flow(SharedKey.wrap, some), 'SharedKey'), initial: t.unknown as HKT\<any, Shared['initial']>, eq: t.unknown as HKT\<any, Shared['eq']>, }), )

*Defined in [src/Shared/core/model/Shared.ts:21](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L21)*
