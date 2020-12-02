**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "http/withHttpManagement"

# Module: "http/withHttpManagement"

## Index

### Interfaces

* [WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md)

### Type aliases

* [Timestamp](_http_withhttpmanagement_.md#timestamp)
* [TimestampedResponse](_http_withhttpmanagement_.md#timestampedresponse)
* [WithHttpManagementOptions](_http_withhttpmanagement_.md#withhttpmanagementoptions)

### Variables

* [DEFAULT\_EXPIRATION](_http_withhttpmanagement_.md#default_expiration)
* [DEFAULT\_METHODS\_TO\_CACHE](_http_withhttpmanagement_.md#default_methods_to_cache)
* [MINUTE](_http_withhttpmanagement_.md#minute)
* [SECOND](_http_withhttpmanagement_.md#second)

### Functions

* [clearOldTimestamps](_http_withhttpmanagement_.md#clearoldtimestamps)
* [createCachedHttpEnv](_http_withhttpmanagement_.md#createcachedhttpenv)
* [getDefaultCacheKey](_http_withhttpmanagement_.md#getdefaultcachekey)
* [isValidStatus](_http_withhttpmanagement_.md#isvalidstatus)
* [withHttpManagement](_http_withhttpmanagement_.md#withhttpmanagement)

## Type aliases

### Timestamp

Ƭ  **Timestamp**: ReturnType\<Clock[\"now\"]>

*Defined in [src/http/withHttpManagement.ts:36](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L36)*

___

### TimestampedResponse

Ƭ  **TimestampedResponse**: { response: [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md) ; timestamp: [Timestamp](_http_withhttpmanagement_.md#timestamp)  }

*Defined in [src/http/withHttpManagement.ts:37](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L37)*

#### Type declaration:

Name | Type |
------ | ------ |
`response` | [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md) |
`timestamp` | [Timestamp](_http_withhttpmanagement_.md#timestamp) |

___

### WithHttpManagementOptions

Ƭ  **WithHttpManagementOptions**: { expiration?: undefined \| number ; getCacheKey?: undefined \| (url: [Uri](_uri_exports_.uri.md), options: [HttpOptions](_http_httpenv_.md#httpoptions)) => string ; methodsToCache?: [HttpMethod](_http_httpmethod_.md#httpmethod)[] ; shouldBeCached?: undefined \| (response: [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md)) => boolean  }

*Defined in [src/http/withHttpManagement.ts:29](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L29)*

#### Type declaration:

Name | Type |
------ | ------ |
`expiration?` | undefined \| number |
`getCacheKey?` | undefined \| (url: [Uri](_uri_exports_.uri.md), options: [HttpOptions](_http_httpenv_.md#httpoptions)) => string |
`methodsToCache?` | [HttpMethod](_http_httpmethod_.md#httpmethod)[] |
`shouldBeCached?` | undefined \| (response: [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md)) => boolean |

## Variables

### DEFAULT\_EXPIRATION

• `Const` **DEFAULT\_EXPIRATION**: number = 5 * MINUTE

*Defined in [src/http/withHttpManagement.ts:26](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L26)*

___

### DEFAULT\_METHODS\_TO\_CACHE

• `Const` **DEFAULT\_METHODS\_TO\_CACHE**: [HttpMethod](_http_httpmethod_.md#httpmethod)[] = ['GET', 'HEAD', 'OPTIONS']

*Defined in [src/http/withHttpManagement.ts:27](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L27)*

___

### MINUTE

• `Const` **MINUTE**: number = 60 * SECOND

*Defined in [src/http/withHttpManagement.ts:25](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L25)*

___

### SECOND

• `Const` **SECOND**: 1000 = 1000

*Defined in [src/http/withHttpManagement.ts:24](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L24)*

## Functions

### clearOldTimestamps

▸ `Const`**clearOldTimestamps**(`expiration`: number): [Effect](_effect_effect_.effect.md)\<[WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md) & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md) & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/http/withHttpManagement.ts:122](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L122)*

#### Parameters:

Name | Type |
------ | ------ |
`expiration` | number |

**Returns:** [Effect](_effect_effect_.effect.md)\<[WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md) & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md) & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

___

### createCachedHttpEnv

▸ **createCachedHttpEnv**(`options`: [WithHttpManagementOptions](_http_withhttpmanagement_.md#withhttpmanagementoptions), `env`: [HttpEnv](../interfaces/_http_httpenv_.httpenv.md) & [WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md)): [HttpEnv](../interfaces/_http_httpenv_.httpenv.md)

*Defined in [src/http/withHttpManagement.ts:75](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L75)*

#### Parameters:

Name | Type |
------ | ------ |
`options` | [WithHttpManagementOptions](_http_withhttpmanagement_.md#withhttpmanagementoptions) |
`env` | [HttpEnv](../interfaces/_http_httpenv_.httpenv.md) & [WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md) |

**Returns:** [HttpEnv](../interfaces/_http_httpenv_.httpenv.md)

___

### getDefaultCacheKey

▸ `Const`**getDefaultCacheKey**(`url`: [Uri](_uri_exports_.uri.md), `options`: [HttpOptions](_http_httpenv_.md#httpoptions)): string

*Defined in [src/http/withHttpManagement.ts:116](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L116)*

#### Parameters:

Name | Type |
------ | ------ |
`url` | [Uri](_uri_exports_.uri.md) |
`options` | [HttpOptions](_http_httpenv_.md#httpoptions) |

**Returns:** string

___

### isValidStatus

▸ **isValidStatus**(`__namedParameters`: { status: number  }): boolean

*Defined in [src/http/withHttpManagement.ts:118](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L118)*

#### Parameters:

Name | Type |
------ | ------ |
`__namedParameters` | { status: number  } |

**Returns:** boolean

___

### withHttpManagement

▸ `Const`**withHttpManagement**(`options`: [WithHttpManagementOptions](_http_withhttpmanagement_.md#withhttpmanagementoptions)): [Provider](_effect_provide_.md#provider)\<[HttpEnv](../interfaces/_http_httpenv_.httpenv.md), [HttpEnv](../interfaces/_http_httpenv_.httpenv.md) & [WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md) & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md) & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md)>

*Defined in [src/http/withHttpManagement.ts:52](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/withHttpManagement.ts#L52)*

Create an in-memory cache for GET requests that are periodically cleaned up when the browser
is idle.

#### Parameters:

Name | Type |
------ | ------ |
`options` | [WithHttpManagementOptions](_http_withhttpmanagement_.md#withhttpmanagementoptions) |

**Returns:** [Provider](_effect_provide_.md#provider)\<[HttpEnv](../interfaces/_http_httpenv_.httpenv.md), [HttpEnv](../interfaces/_http_httpenv_.httpenv.md) & [WithHttpManagementEnv](../interfaces/_http_withhttpmanagement_.withhttpmanagementenv.md) & [FiberEnv](../interfaces/_fiber_fiberenv_.fiberenv.md) & [WhenIdleEnv](../interfaces/_dom_whenidle_.whenidleenv.md) & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md)>
