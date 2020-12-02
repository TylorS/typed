**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "dom/whenIdle"

# Module: "dom/whenIdle"

## Index

### Namespaces

* [IdleCallbackHandle](_dom_whenidle_.idlecallbackhandle.md)
* [\_\_global](_dom_whenidle_.__global.md)

### Interfaces

* [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md)

### Type aliases

* [IdleCallbackDeadline](_dom_whenidle_.md#idlecallbackdeadline)
* [IdleCallbackOptions](_dom_whenidle_.md#idlecallbackoptions)

### Variables

* [DEFAULT\_TIMEOUT](_dom_whenidle_.md#default_timeout)

### Functions

* [createFallbackWhenIdleEnv](_dom_whenidle_.md#createfallbackwhenidleenv)
* [whenIdle](_dom_whenidle_.md#whenidle)

## Type aliases

### IdleCallbackDeadline

Ƭ  **IdleCallbackDeadline**: { didTimeout: boolean ; timeRemaining: () => number  }

*Defined in [src/dom/whenIdle.ts:36](https://github.com/TylorS/typed-fp/blob/8639976/src/dom/whenIdle.ts#L36)*

RequestIdleCallback deadline type

#### Type declaration:

Name | Type |
------ | ------ |
`didTimeout` | boolean |
`timeRemaining` | () => number |

___

### IdleCallbackOptions

Ƭ  **IdleCallbackOptions**: { timeout: number  }

*Defined in [src/dom/whenIdle.ts:44](https://github.com/TylorS/typed-fp/blob/8639976/src/dom/whenIdle.ts#L44)*

Options for requestIdleCallback

#### Type declaration:

Name | Type |
------ | ------ |
`timeout` | number |

## Variables

### DEFAULT\_TIMEOUT

• `Const` **DEFAULT\_TIMEOUT**: number = 30 * 1000

*Defined in [src/dom/whenIdle.ts:64](https://github.com/TylorS/typed-fp/blob/8639976/src/dom/whenIdle.ts#L64)*

## Functions

### createFallbackWhenIdleEnv

▸ **createFallbackWhenIdleEnv**(`timer`: Timer, `defaultTimeout?`: number): object

*Defined in [src/dom/whenIdle.ts:69](https://github.com/TylorS/typed-fp/blob/8639976/src/dom/whenIdle.ts#L69)*

Given a Timer instance to create a WhenIdleEnv implementation.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`timer` | Timer | - |
`defaultTimeout` | number | DEFAULT\_TIMEOUT |

**Returns:** object

Name | Type |
------ | ------ |
`cancelIdleCallback` | cancelIdleCallback |
`requestIdleCallback` | requestIdleCallback |

___

### whenIdle

▸ `Const`**whenIdle**(`opts?`: [IdleCallbackOptions](_dom_whenidle_.md#idlecallbackoptions)): [Effect](_effect_effect_.effect.md)\<[WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md), [IdleCallbackDeadline](_dom_whenidle_.md#idlecallbackdeadline)>

*Defined in [src/dom/whenIdle.ts:51](https://github.com/TylorS/typed-fp/blob/8639976/src/dom/whenIdle.ts#L51)*

An Effect for waiting to perform work cooperatively with the main thread.

#### Parameters:

Name | Type |
------ | ------ |
`opts?` | [IdleCallbackOptions](_dom_whenidle_.md#idlecallbackoptions) |

**Returns:** [Effect](_effect_effect_.effect.md)\<[WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md), [IdleCallbackDeadline](_dom_whenidle_.md#idlecallbackdeadline)>
