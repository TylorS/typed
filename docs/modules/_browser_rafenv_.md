**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "browser/RafEnv"

# Module: "browser/RafEnv"

## Index

### Variables

* [provideRafEnv](_browser_rafenv_.md#providerafenv)

### Object literals

* [rafEnv](_browser_rafenv_.md#rafenv)

## Variables

### provideRafEnv

• `Const` **provideRafEnv**: [Provider](_effect_provide_.md#provider)\<[RafEnv](../interfaces/_dom_raf_.rafenv.md)> = provideSome(rafEnv)

*Defined in [src/browser/RafEnv.ts:16](https://github.com/TylorS/typed-fp/blob/f129829/src/browser/RafEnv.ts#L16)*

Provide a RafEnv to an Effect using the native browser implementation of requestAnimationFrame.

## Object literals

### rafEnv

▪ `Const` **rafEnv**: object

*Defined in [src/browser/RafEnv.ts:8](https://github.com/TylorS/typed-fp/blob/f129829/src/browser/RafEnv.ts#L8)*

Browser implementation of RafEnv with a return handle of `number` matching that of the
native requestAnimationFrame and cancelAnimationFrame.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelAnimationFrame` | function | (n: number) => void |
`requestAnimationFrame` | function | (cb: FrameRequestCallback) => number |
