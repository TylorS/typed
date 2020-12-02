**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "node/RafEnv"

# Module: "node/RafEnv"

## Index

### Variables

* [lastTime](_node_rafenv_.md#lasttime)
* [provideNoOpRafEnv](_node_rafenv_.md#providenooprafenv)
* [provideRafEnv](_node_rafenv_.md#providerafenv)

### Functions

* [getNextTime](_node_rafenv_.md#getnexttime)

### Object literals

* [noOpRafEnv](_node_rafenv_.md#nooprafenv)
* [rafEnv](_node_rafenv_.md#rafenv)

## Variables

### lastTime

• `Let` **lastTime**: number = performance.now()

*Defined in [src/node/RafEnv.ts:5](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L5)*

___

### provideNoOpRafEnv

• `Const` **provideNoOpRafEnv**: [Provider](_effect_provide_.md#provider)\<[RafEnv](../interfaces/_dom_raf_.rafenv.md)\<any>, unknown> = provideSome\<RafEnv>(noOpRafEnv)

*Defined in [src/node/RafEnv.ts:45](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L45)*

Provide an Effect with a RafEnv that will not schedule any work

___

### provideRafEnv

• `Const` **provideRafEnv**: [Provider](_effect_provide_.md#provider)\<[RafEnv](../interfaces/_dom_raf_.rafenv.md)\<any>, unknown> = provideSome\<RafEnv>(rafEnv)

*Defined in [src/node/RafEnv.ts:25](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L25)*

Provide an Effect with a setTimeout-based RafEnv

## Functions

### getNextTime

▸ **getNextTime**(): number

*Defined in [src/node/RafEnv.ts:27](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L27)*

**Returns:** number

## Object literals

### noOpRafEnv

▪ `Const` **noOpRafEnv**: object

*Defined in [src/node/RafEnv.ts:37](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L37)*

A RafEnv implementation that does not schedule nor cancel any kind of work.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelAnimationFrame` | function | () => undefined |
`requestAnimationFrame` | function | () => undefined |

___

### rafEnv

▪ `Const` **rafEnv**: object

*Defined in [src/node/RafEnv.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/RafEnv.ts#L10)*

A setTimeout based implementation of raf for Node

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelAnimationFrame` | clearTimeout | clearTimeout |
`requestAnimationFrame` | function | (cb: FrameRequestCallback) => Timeout |
