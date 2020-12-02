**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/patchOnRaf"

# Module: "Patch/patchOnRaf"

## Index

### Type aliases

* [PatchOnRafEnv](_patch_patchonraf_.md#patchonrafenv)

### Variables

* [namespaceUpdatedGuard](_patch_patchonraf_.md#namespaceupdatedguard)
* [sharedValueUpdatedGuard](_patch_patchonraf_.md#sharedvalueupdatedguard)

### Functions

* [createGuard](_patch_patchonraf_.md#createguard)
* [patchOnRaf](_patch_patchonraf_.md#patchonraf)

## Type aliases

### PatchOnRafEnv

Ƭ  **PatchOnRafEnv**\<A, B>: [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md) & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [RafEnv](../interfaces/_dom_raf_.rafenv.md) & [Patch](../interfaces/_patch_patch_.patch.md)\<A, B>

*Defined in [src/Patch/patchOnRaf.ts:19](https://github.com/TylorS/typed-fp/blob/559f273/src/Patch/patchOnRaf.ts#L19)*

#### Type parameters:

Name |
------ |
`A` |
`B` |

## Variables

### namespaceUpdatedGuard

• `Const` **namespaceUpdatedGuard**: Guard\<unknown, [NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)> = pipe(NamespaceUpdated.schema, createGuardFromSchema)

*Defined in [src/Patch/patchOnRaf.ts:21](https://github.com/TylorS/typed-fp/blob/559f273/src/Patch/patchOnRaf.ts#L21)*

___

### sharedValueUpdatedGuard

• `Const` **sharedValueUpdatedGuard**: Guard\<unknown, [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = pipe(SharedValueUpdated.schema, createGuardFromSchema)

*Defined in [src/Patch/patchOnRaf.ts:22](https://github.com/TylorS/typed-fp/blob/559f273/src/Patch/patchOnRaf.ts#L22)*

## Functions

### createGuard

▸ `Const`**createGuard**(`namespace`: [Namespace](_shared_core_model_namespace_.namespace.md)): Guard\<unknown, [NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md) \| [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>

*Defined in [src/Patch/patchOnRaf.ts:24](https://github.com/TylorS/typed-fp/blob/559f273/src/Patch/patchOnRaf.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`namespace` | [Namespace](_shared_core_model_namespace_.namespace.md) |

**Returns:** Guard\<unknown, [NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md) \| [SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)>

___

### patchOnRaf

▸ **patchOnRaf**\<A, E, B>(`initial`: A, `main`: [Effect](_effect_effect_.effect.md)\<E, B>): [Effect](_effect_effect_.effect.md)\<E & [PatchOnRafEnv](_patch_patchonraf_.md#patchonrafenv)\<A, B>, never>

*Defined in [src/Patch/patchOnRaf.ts:33](https://github.com/TylorS/typed-fp/blob/559f273/src/Patch/patchOnRaf.ts#L33)*

Keep the root of an Application properly Patched

#### Type parameters:

Name | Type |
------ | ------ |
`A` | - |
`E` | [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) |
`B` | - |

#### Parameters:

Name | Type |
------ | ------ |
`initial` | A |
`main` | [Effect](_effect_effect_.effect.md)\<E, B> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [PatchOnRafEnv](_patch_patchonraf_.md#patchonrafenv)\<A, B>, never>
