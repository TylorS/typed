**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/State/NamespaceStates"

# Module: "Shared/State/NamespaceStates"

## Index

### Variables

* [SharedStates](_shared_state_namespacestates_.md#sharedstates)
* [getSharedStates](_shared_state_namespacestates_.md#getsharedstates)

## Variables

### SharedStates

• `Const` **SharedStates**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [State](_shared_state_state_.md#state)\<any, any>>> = createShared( Symbol.for('SharedStates'), Pure.fromIO(() => new Map\<SharedKey, State\<any>>()),)

*Defined in [src/Shared/State/NamespaceStates.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/State/NamespaceStates.ts#L9)*

Memoize the creation of State objects wrapping Shared value.

___

### getSharedStates

• `Const` **getSharedStates**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, [State](_shared_state_state_.md#state)\<any, any>>> = getShared(SharedStates)

*Defined in [src/Shared/State/NamespaceStates.ts:17](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/State/NamespaceStates.ts#L17)*

Get Map of SharedStates
