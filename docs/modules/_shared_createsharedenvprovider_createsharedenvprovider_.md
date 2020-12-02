**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/createSharedEnvProvider/createSharedEnvProvider"

# Module: "Shared/createSharedEnvProvider/createSharedEnvProvider"

## Index

### Type aliases

* [SharedEnvOptions](_shared_createsharedenvprovider_createsharedenvprovider_.md#sharedenvoptions)

### Functions

* [createEmptySink](_shared_createsharedenvprovider_createsharedenvprovider_.md#createemptysink)
* [createSharedEnvProvider](_shared_createsharedenvprovider_createsharedenvprovider_.md#createsharedenvprovider)
* [listenToEvents](_shared_createsharedenvprovider_createsharedenvprovider_.md#listentoevents)

## Type aliases

### SharedEnvOptions

Ƭ  **SharedEnvOptions**: { handlers: ReadonlyArray\<[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<any>> ; namespace?: [Namespace](_shared_core_model_namespace_.namespace.md)  }

*Defined in [src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts:25](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts#L25)*

#### Type declaration:

Name | Type |
------ | ------ |
`handlers` | ReadonlyArray\<[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<any>> |
`namespace?` | [Namespace](_shared_core_model_namespace_.namespace.md) |

## Functions

### createEmptySink

▸ **createEmptySink**\<A>(`onValue`: (value: A) => void): Sink\<A>

*Defined in [src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts:69](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts#L69)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`onValue` | (value: A) => void |

**Returns:** Sink\<A>

___

### createSharedEnvProvider

▸ **createSharedEnvProvider**(`options`: [SharedEnvOptions](_shared_createsharedenvprovider_createsharedenvprovider_.md#sharedenvoptions)): [Provider](_effect_provide_.md#provider)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md)>

*Defined in [src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts:36](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts#L36)*

Create a SharedEnv Provider that will listen to SharedEvents to provide additional
functionality.

#### Parameters:

Name | Type |
------ | ------ |
`options` | [SharedEnvOptions](_shared_createsharedenvprovider_createsharedenvprovider_.md#sharedenvoptions) |

**Returns:** [Provider](_effect_provide_.md#provider)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md)>

___

### listenToEvents

▸ `Const`**listenToEvents**(`handlers`: ReadonlyNonEmptyArray\<[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<any>>, `env`: [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md)): [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md)>

*Defined in [src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts:45](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/createSharedEnvProvider/createSharedEnvProvider.ts#L45)*

#### Parameters:

Name | Type |
------ | ------ |
`handlers` | ReadonlyNonEmptyArray\<[SharedEventHandler](_shared_createsharedenvprovider_sharedeventhandler_.md#sharedeventhandler)\<any>> |
`env` | [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md)>
