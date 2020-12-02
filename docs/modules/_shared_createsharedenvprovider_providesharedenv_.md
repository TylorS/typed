**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/provideSharedEnv"

# Module: "Shared/createSharedEnvProvider/provideSharedEnv"

## Index

### Functions

* [provideSharedEnv](_shared_createsharedenvprovider_providesharedenv_.md#providesharedenv)

## Functions

### provideSharedEnv

▸ `Const`**provideSharedEnv**(`effect`: [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), A>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Shared/createSharedEnvProvider/provideSharedEnv.ts:19](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/createSharedEnvProvider/provideSharedEnv.ts#L19)*

This is for running an application defined using an Effect requiring a SharedEnv, using

**`most/schedulers`** default scheduler andour "defaultHandlers" which powers the core functionality,
a react-hooks-like functionality, and areact-context-like functionality through the use of listening
to and responding to SharedEvent occurences. The default namespace for this root-level effect will be
that of our GlobalNamespace.

You can use createSharedEnvProvider and provide your own handlers to replace or add any and all functionality
as you see fit. It can be convenient to always use GlobalNamespace to have an easy way to reach up into the root.

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>
