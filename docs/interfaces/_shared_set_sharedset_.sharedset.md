**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/set/SharedSet"](../modules/_shared_set_sharedset_.md) / SharedSet

# Interface: SharedSet\<SK, V>

A ReadonlySet Shared value

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`SK` | [SharedKey](../modules/_shared_core_model_sharedkey_.sharedkey.md) | SharedKey |
`V` | - | any |

## Hierarchy

* [Shared](../modules/_shared_core_model_shared_.shared.md)\<SK, unknown, ReadonlySet\<V>>

  ↳ **SharedSet**

## Index

### Properties

* [eq](_shared_set_sharedset_.sharedset.md#eq)
* [initial](_shared_set_sharedset_.sharedset.md#initial)
* [key](_shared_set_sharedset_.sharedset.md#key)
* [schema](_shared_set_sharedset_.sharedset.md#schema)

## Properties

### eq

• `Readonly` **eq**: Eq\<ReadonlySet\<V>>

*Inherited from [Shared](../modules/_shared_core_model_shared_.shared.md).[eq](../modules/_shared_core_model_shared_.shared.md#eq)*

*Defined in [src/Shared/core/model/Shared.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L17)*

___

### initial

• `Readonly` **initial**: [Effect](../modules/_effect_effect_.effect.md)\<unknown, ReadonlySet\<V>>

*Inherited from [Shared](../modules/_shared_core_model_shared_.shared.md).[initial](../modules/_shared_core_model_shared_.shared.md#initial)*

*Defined in [src/Shared/core/model/Shared.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L16)*

___

### key

• `Readonly` **key**: SK

*Inherited from [Shared](../modules/_shared_core_model_shared_.shared.md).[key](../modules/_shared_core_model_shared_.shared.md#key)*

*Defined in [src/Shared/core/model/Shared.ts:15](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L15)*

___

### schema

•  **schema**: [TypedSchema](_io_typedschema_.typedschema.md)\<[Shared](../modules/_shared_core_model_shared_.shared.md)\<[SharedKey](../modules/_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>> = createSchema\<Shared>((t) => t.type({ key: t.newtype(t.propertyKey, flow(SharedKey.wrap, some), 'SharedKey'), initial: t.unknown as HKT\<any, Shared['initial']>, eq: t.unknown as HKT\<any, Shared['eq']>, }), )

*Defined in [src/Shared/core/model/Shared.ts:21](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/model/Shared.ts#L21)*
