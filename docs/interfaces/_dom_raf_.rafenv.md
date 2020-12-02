**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["dom/raf"](../modules/_dom_raf_.md) / RafEnv

# Interface: RafEnv\<Handle>

An environment type for scheduling and cancelling with requestAnimationFrame.

## Type parameters

Name | Default |
------ | ------ |
`Handle` | any |

## Hierarchy

* **RafEnv**

## Index

### Properties

* [cancelAnimationFrame](_dom_raf_.rafenv.md#cancelanimationframe)
* [requestAnimationFrame](_dom_raf_.rafenv.md#requestanimationframe)

## Properties

### cancelAnimationFrame

• `Readonly` **cancelAnimationFrame**: (handle: Handle) => void

*Defined in [src/dom/raf.ts:10](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/dom/raf.ts#L10)*

___

### requestAnimationFrame

• `Readonly` **requestAnimationFrame**: (callback: FrameRequestCallback) => Handle

*Defined in [src/dom/raf.ts:9](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/dom/raf.ts#L9)*
