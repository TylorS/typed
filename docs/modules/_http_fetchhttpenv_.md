**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "http/FetchHttpEnv"

# Module: "http/FetchHttpEnv"

## Index

### Variables

* [utf8Decoder](_http_fetchhttpenv_.md#utf8decoder)

### Functions

* [combineChunks](_http_fetchhttpenv_.md#combinechunks)
* [httpFetchRequest](_http_fetchhttpenv_.md#httpfetchrequest)
* [onProgress](_http_fetchhttpenv_.md#onprogress)

### Object literals

* [FetchHttEnv](_http_fetchhttpenv_.md#fetchhttenv)

## Variables

### utf8Decoder

• `Const` **utf8Decoder**: TextDecoder = new TextDecoder('utf-8')

*Defined in [src/http/FetchHttpEnv.ts:16](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/FetchHttpEnv.ts#L16)*

## Functions

### combineChunks

▸ **combineChunks**(`chunks`: ReadonlyArray\<Uint8Array>, `loaded`: number): string

*Defined in [src/http/FetchHttpEnv.ts:116](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/FetchHttpEnv.ts#L116)*

#### Parameters:

Name | Type |
------ | ------ |
`chunks` | ReadonlyArray\<Uint8Array> |
`loaded` | number |

**Returns:** string

___

### httpFetchRequest

▸ **httpFetchRequest**(`uri`: [Uri](_uri_exports_.uri.md), `options`: [HttpOptions](_http_httpenv_.md#httpoptions)): [Resume](_resume_resume_.md#resume)\<Either\<Error, [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md)>>

*Defined in [src/http/FetchHttpEnv.ts:18](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/FetchHttpEnv.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`uri` | [Uri](_uri_exports_.uri.md) |
`options` | [HttpOptions](_http_httpenv_.md#httpoptions) |

**Returns:** [Resume](_resume_resume_.md#resume)\<Either\<Error, [HttpResponse](../interfaces/_http_httpresponse_.httpresponse.md)>>

___

### onProgress

▸ **onProgress**(`response`: Response, `total`: Option\<number>, `onProgress`: NonNullable\<HttpOptions[\"onProgress\"]>): Promise\<string>

*Defined in [src/http/FetchHttpEnv.ts:79](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/FetchHttpEnv.ts#L79)*

#### Parameters:

Name | Type |
------ | ------ |
`response` | Response |
`total` | Option\<number> |
`onProgress` | NonNullable\<HttpOptions[\"onProgress\"]> |

**Returns:** Promise\<string>

## Object literals

### FetchHttEnv

▪ `Const` **FetchHttEnv**: object

*Defined in [src/http/FetchHttpEnv.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/http/FetchHttpEnv.ts#L14)*

An implementation of HttpEnv using the Fetch API, supports progress events.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`http` | [httpFetchRequest](_http_fetchhttpenv_.md#httpfetchrequest) | httpFetchRequest |
