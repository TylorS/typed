**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/model/Shared"

# Module: "Shared/core/model/Shared"

## Index

### Namespaces

* [Shared](_shared_core_model_shared_.shared.md)

### Type aliases

* [GetSharedEnv](_shared_core_model_shared_.md#getsharedenv)
* [GetSharedKey](_shared_core_model_shared_.md#getsharedkey)
* [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)

## Type aliases

### GetSharedEnv

Ƭ  **GetSharedEnv**\<A>: EffEnv\<A[\"initial\"]>

*Defined in [src/Shared/core/model/Shared.ts:44](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/model/Shared.ts#L44)*

Get the requirements for a Shared value to satisfy it's
type-signature.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Shared](_shared_core_model_shared_.shared.md) |

___

### GetSharedKey

Ƭ  **GetSharedKey**\<A>: A[\"key\"]

*Defined in [src/Shared/core/model/Shared.ts:33](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/model/Shared.ts#L33)*

Get the key of a shared value type

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Shared](_shared_core_model_shared_.shared.md) |

___

### GetSharedValue

Ƭ  **GetSharedValue**\<A>: [ReturnOf](_effect_effect_.md#returnof)\<A[\"initial\"]>

*Defined in [src/Shared/core/model/Shared.ts:38](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/model/Shared.ts#L38)*

Get the value of a shared value type

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Shared](_shared_core_model_shared_.shared.md) |
