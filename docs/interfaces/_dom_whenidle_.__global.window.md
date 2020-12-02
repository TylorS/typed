**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["dom/whenIdle"](../modules/_dom_whenidle_.md) / [\_\_global](../modules/_dom_whenidle_.__global.md) / Window

# Interface: Window

## Hierarchy

* [WhenIdleEnv](_dom_whenidle_.whenidleenv.md)

  ↳ **Window**

## Index

### Properties

* [cancelIdleCallback](_dom_whenidle_.__global.window.md#cancelidlecallback)
* [requestIdleCallback](_dom_whenidle_.__global.window.md#requestidlecallback)

## Properties

### cancelIdleCallback

• `Readonly` **cancelIdleCallback**: (handle: [IdleCallbackHandle](../modules/_dom_whenidle_.idlecallbackhandle.md)) => void

*Inherited from [WhenIdleEnv](_dom_whenidle_.whenidleenv.md).[cancelIdleCallback](_dom_whenidle_.whenidleenv.md#cancelidlecallback)*

*Defined in [src/dom/whenIdle.ts:25](https://github.com/TylorS/typed-fp/blob/f129829/src/dom/whenIdle.ts#L25)*

___

### requestIdleCallback

• `Readonly` **requestIdleCallback**: (callback: (deadline: [IdleCallbackDeadline](../modules/_dom_whenidle_.md#idlecallbackdeadline)) => void, opts?: [IdleCallbackOptions](../modules/_dom_whenidle_.md#idlecallbackoptions)) => [IdleCallbackHandle](../modules/_dom_whenidle_.idlecallbackhandle.md)

*Inherited from [WhenIdleEnv](_dom_whenidle_.whenidleenv.md).[requestIdleCallback](_dom_whenidle_.whenidleenv.md#requestidlecallback)*

*Defined in [src/dom/whenIdle.ts:20](https://github.com/TylorS/typed-fp/blob/f129829/src/dom/whenIdle.ts#L20)*
