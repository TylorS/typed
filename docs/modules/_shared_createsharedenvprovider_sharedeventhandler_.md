**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/SharedEventHandler"

# Module: "Shared/createSharedEnvProvider/SharedEventHandler"

## Index

### Type aliases

* [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)

### Functions

* [createSharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#createsharedeventhandler)

## Type aliases

### SharedEventHandler

Ƭ  **SharedEventHandler**\<A>: readonly [guard: Guard\<unknown, A>, handler: function]

*Defined in [src/Shared/createSharedEnvProvider/SharedEventHandler.ts:6](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/createSharedEnvProvider/SharedEventHandler.ts#L6)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md) |

## Functions

### createSharedEventHandler

▸ **createSharedEventHandler**\<A>(`guard`: Guard\<unknown, A>, `handler`: (value: A) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any>): [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<A>

*Defined in [src/Shared/createSharedEnvProvider/SharedEventHandler.ts:14](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/createSharedEnvProvider/SharedEventHandler.ts#L14)*

Construct SharedEventHandler instances

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [SharedEvent](_shared_core_events_sharedevent_.sharedevent.md) |

#### Parameters:

Name | Type |
------ | ------ |
`guard` | Guard\<unknown, A> |
`handler` | (value: A) => [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), any> |

**Returns:** [SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<A>
