**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["dom/whenIdle"](../modules/_dom_whenidle_.md) / WhenIdleEnv

# Interface: WhenIdleEnv

An environment for scheduling and cancelling work using requestIdleCallback.

## Hierarchy

* **WhenIdleEnv**

  ↳ [Window](_dom_whenidle_.__global.window.md)

## Index

### Properties

* [cancelIdleCallback](_dom_whenidle_.whenidleenv.md#cancelidlecallback)
* [requestIdleCallback](_dom_whenidle_.whenidleenv.md#requestidlecallback)

## Properties

### cancelIdleCallback

• `Readonly` **cancelIdleCallback**: (handle: [IdleCallbackHandle](../modules/_dom_whenidle_.idlecallbackhandle.md)) => void

*Defined in [src/dom/whenIdle.ts:25](https://github.com/TylorS/typed-fp/blob/6ccb290/src/dom/whenIdle.ts#L25)*

___

### requestIdleCallback

• `Readonly` **requestIdleCallback**: (callback: (deadline: [IdleCallbackDeadline](../modules/_dom_whenidle_.md#idlecallbackdeadline)) => void, opts?: [IdleCallbackOptions](../modules/_dom_whenidle_.md#idlecallbackoptions)) => [IdleCallbackHandle](../modules/_dom_whenidle_.idlecallbackhandle.md)

*Defined in [src/dom/whenIdle.ts:20](https://github.com/TylorS/typed-fp/blob/6ccb290/src/dom/whenIdle.ts#L20)*
