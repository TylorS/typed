**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "browser/WhenIdleEnv"

# Module: "browser/WhenIdleEnv"

## Index

### Variables

* [provideWhenIdleEnv](_browser_whenidleenv_.md#providewhenidleenv)

### Object literals

* [whenIdleEnv](_browser_whenidleenv_.md#whenidleenv)

## Variables

### provideWhenIdleEnv

• `Const` **provideWhenIdleEnv**: [Provider](_effect_provide_.md#provider)\<[WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md)> = provideSome(whenIdleEnv)

*Defined in [src/browser/WhenIdleEnv.ts:24](https://github.com/TylorS/typed-fp/blob/41076ce/src/browser/WhenIdleEnv.ts#L24)*

Provide an Effect with a requestIdleCallback version of WhenIdleEnv.

## Object literals

### whenIdleEnv

▪ `Const` **whenIdleEnv**: object

*Defined in [src/browser/WhenIdleEnv.ts:13](https://github.com/TylorS/typed-fp/blob/41076ce/src/browser/WhenIdleEnv.ts#L13)*

Browser implementation of WhenIdleEnv that uses requestIdleCallback to schedule work to be done when
no other higher-priority work needed to be done.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`cancelIdleCallback` | function | (handle: [IdleCallbackHandle](_dom_whenidle_.idlecallbackhandle.md)) => void |
`requestIdleCallback` | function | (cb: (deadline: [IdleCallbackDeadline](_dom_whenidle_.md#idlecallbackdeadline)) => void, opts?: [IdleCallbackOptions](_dom_whenidle_.md#idlecallbackoptions) \| undefined) => [IdleCallbackHandle](_dom_whenidle_.idlecallbackhandle.md) |
