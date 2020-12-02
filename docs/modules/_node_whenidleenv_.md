**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "node/WhenIdleEnv"

# Module: "node/WhenIdleEnv"

## Index

### Variables

* [WHEN\_IDLE\_TIMEOUT](_node_whenidleenv_.md#when_idle_timeout)
* [maxMs](_node_whenidleenv_.md#maxms)
* [provideNoOpWhenIdleEnv](_node_whenidleenv_.md#providenoopwhenidleenv)
* [provideWhenIdleEnv](_node_whenidleenv_.md#providewhenidleenv)

### Object literals

* [noOpWhenIdleEnv](_node_whenidleenv_.md#noopwhenidleenv)
* [whenIdleEnv](_node_whenidleenv_.md#whenidleenv)

## Variables

### WHEN\_IDLE\_TIMEOUT

• `Const` **WHEN\_IDLE\_TIMEOUT**: string = process.env.WHEN\_IDLE\_TIMEOUT \|\| '100'

*Defined in [src/node/WhenIdleEnv.ts:8](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L8)*

___

### maxMs

• `Const` **maxMs**: number = parseInt(WHEN\_IDLE\_TIMEOUT)

*Defined in [src/node/WhenIdleEnv.ts:9](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L9)*

___

### provideNoOpWhenIdleEnv

• `Const` **provideNoOpWhenIdleEnv**: [Provider](_effect_provide_.md#provider)\<[WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md)> = provideSome\<WhenIdleEnv>( noOpWhenIdleEnv,)

*Defined in [src/node/WhenIdleEnv.ts:45](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L45)*

___

### provideWhenIdleEnv

• `Const` **provideWhenIdleEnv**: [Provider](_effect_provide_.md#provider)\<[WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md)> = provideSome\<WhenIdleEnv>(whenIdleEnv)

*Defined in [src/node/WhenIdleEnv.ts:35](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L35)*

Provide an Effect with a setTimeout-based WhenIdleEnv.

## Object literals

### noOpWhenIdleEnv

▪ `Const` **noOpWhenIdleEnv**: object

*Defined in [src/node/WhenIdleEnv.ts:40](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L40)*

An implementation of WhenIdleEnv that will not schedule any work to be performed.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelIdleCallback` | Lazy\<void> | constVoid |
`requestIdleCallback` | function | () => [IdleCallbackHandle](_dom_whenidle_.idlecallbackhandle.md) |

___

### whenIdleEnv

▪ `Const` **whenIdleEnv**: object

*Defined in [src/node/WhenIdleEnv.ts:16](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/node/WhenIdleEnv.ts#L16)*

A setTimeout based implementation of WhenIdleEnv for node and other non-browser environments.
Every deadline will have 100 milliseconds available to it by default. Use process.env.WHEN_IDLE_TIMEOUT
to configure this timeout yourself.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelIdleCallback` | function | rafEnv.cancelAnimationFrame |
`requestIdleCallback` | function | (cb: (deadline: [IdleCallbackDeadline](_dom_whenidle_.md#idlecallbackdeadline)) => void) => any |
