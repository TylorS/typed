**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/memoNamespace/memoNamespace"

# Module: "Shared/memoNamespace/memoNamespace"

## Index

### Variables

* [HAS\_BEEN\_UPDATED](_shared_memonamespace_memonamespace_.md#has_been_updated)
* [RETURN\_VALUE](_shared_memonamespace_memonamespace_.md#return_value)

### Functions

* [HasBeenUpdated](_shared_memonamespace_memonamespace_.md#hasbeenupdated)
* [ReturnValue](_shared_memonamespace_memonamespace_.md#returnvalue)
* [memoNamespace](_shared_memonamespace_memonamespace_.md#memonamespace)

## Variables

### HAS\_BEEN\_UPDATED

• `Const` **HAS\_BEEN\_UPDATED**: unique symbol = Symbol.for('HasBeenUpdated')

*Defined in [src/Shared/memoNamespace/memoNamespace.ts:52](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/memoNamespace/memoNamespace.ts#L52)*

___

### RETURN\_VALUE

• `Const` **RETURN\_VALUE**: unique symbol = Symbol.for('ReturnValue')

*Defined in [src/Shared/memoNamespace/memoNamespace.ts:48](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/memoNamespace/memoNamespace.ts#L48)*

## Functions

### HasBeenUpdated

▸ `Const`**HasBeenUpdated**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md)): [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<*typeof* [HAS\_BEEN\_UPDATED](_shared_memonamespace_memonamespace_.md#has_been_updated)>, [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<boolean>>

*Defined in [src/Shared/memoNamespace/memoNamespace.ts:53](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/memoNamespace/memoNamespace.ts#L53)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<*typeof* [HAS\_BEEN\_UPDATED](_shared_memonamespace_memonamespace_.md#has_been_updated)>, [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<boolean>>

___

### ReturnValue

▸ `Const`**ReturnValue**\<E, A>(`initial`: [Effect](_effect_effect_.effect.md)\<E, A>): [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<unique symbol>, E, A>

*Defined in [src/Shared/memoNamespace/memoNamespace.ts:49](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/memoNamespace/memoNamespace.ts#L49)*

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`initial` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<unique symbol>, E, A>

___

### memoNamespace

▸ `Const`**memoNamespace**\<E, A>(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md), `effect`: [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>

*Defined in [src/Shared/memoNamespace/memoNamespace.ts:26](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/memoNamespace/memoNamespace.ts#L26)*

Memoize the result of an effect, only updating when Namespace
has been marked as updated.

#### Type parameters:

Name | Type |
------ | ------ |
`E` | [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) |
`A` | - |

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), A>
