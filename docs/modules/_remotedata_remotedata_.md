**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/RemoteData"

# Module: "RemoteData/RemoteData"

## Index

### Type aliases

* [Loaded](_remotedata_remotedata_.md#loaded)
* [Loading](_remotedata_remotedata_.md#loading)
* [NoData](_remotedata_remotedata_.md#nodata)
* [Refreshing](_remotedata_remotedata_.md#refreshing)
* [RemoteData](_remotedata_remotedata_.md#remotedata)

### Functions

* [fromEither](_remotedata_remotedata_.md#fromeither)
* [progress](_remotedata_remotedata_.md#progress)

### Object literals

* [Loading](_remotedata_remotedata_.md#loading)
* [NoData](_remotedata_remotedata_.md#nodata)

## Type aliases

### Loaded

Ƭ  **Loaded**\<A, B>: [Failure](_remotedata_failure_.failure.md)\<A> \| [Success](_remotedata_success_.success.md)\<B>

*Defined in [src/RemoteData/RemoteData.ts:24](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L24)*

Loaded states of RemoteData

#### Type parameters:

Name | Default |
------ | ------ |
`A` | unknown |
`B` | unknown |

___

### Loading

Ƭ  **Loading**: { progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> ; status: [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading)  }

*Defined in [src/RemoteData/RemoteData.ts:46](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L46)*

Loading state of RemoteData with optional Progress status

#### Type declaration:

Name | Type |
------ | ------ |
`progress` | Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> |
`status` | [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading) |

___

### NoData

Ƭ  **NoData**: { status: [NoData](../enums/_remotedata_enums_.remotedatastatus.md#nodata)  }

*Defined in [src/RemoteData/RemoteData.ts:34](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L34)*

NoData state

#### Type declaration:

Name | Type |
------ | ------ |
`status` | [NoData](../enums/_remotedata_enums_.remotedatastatus.md#nodata) |

___

### Refreshing

Ƭ  **Refreshing**\<A, B>: [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<A> \| [RefreshingSuccess](_remotedata_refreshingsuccess_.refreshingsuccess.md)\<B>

*Defined in [src/RemoteData/RemoteData.ts:29](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L29)*

Refreshing states of RemoteData

#### Type parameters:

Name | Default |
------ | ------ |
`A` | unknown |
`B` | unknown |

___

### RemoteData

Ƭ  **RemoteData**\<A, B>: [NoData](_remotedata_remotedata_.md#nodata) \| [Loading](_remotedata_remotedata_.md#loading) \| [Loaded](_remotedata_remotedata_.md#loaded)\<A, B> \| [Refreshing](_remotedata_remotedata_.md#refreshing)\<A, B>

*Defined in [src/RemoteData/RemoteData.ts:15](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L15)*

A data structure to represent all of the states possible for loading a remote
piece of data.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | unknown |
`B` | unknown |

## Functions

### fromEither

▸ `Const`**fromEither**\<A, B>(`either`: Either\<A, B>): [Loaded](_remotedata_remotedata_.md#loaded)\<A, B>

*Defined in [src/RemoteData/RemoteData.ts:67](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L67)*

Create a Loaded<A, B> from an Either<A, B>

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`either` | Either\<A, B> |

**Returns:** [Loaded](_remotedata_remotedata_.md#loaded)\<A, B>

___

### progress

▸ `Const`**progress**(`progress`: [Progress](../interfaces/_remotedata_progress_.progress.md)): [Loading](_remotedata_remotedata_.md#loading)

*Defined in [src/RemoteData/RemoteData.ts:59](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L59)*

Construct Loading states with Progress

#### Parameters:

Name | Type |
------ | ------ |
`progress` | [Progress](../interfaces/_remotedata_progress_.progress.md) |

**Returns:** [Loading](_remotedata_remotedata_.md#loading)

## Object literals

### Loading

▪ `Const` **Loading**: object

*Defined in [src/RemoteData/RemoteData.ts:54](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L54)*

Loading singleton

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`progress` | Option\<never> | none |
`status` | [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading) | RemoteDataStatus.Loading |

___

### NoData

▪ `Const` **NoData**: object

*Defined in [src/RemoteData/RemoteData.ts:41](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/RemoteData.ts#L41)*

NoData singleton

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`status` | [NoData](../enums/_remotedata_enums_.remotedatastatus.md#nodata) | RemoteDataStatus.NoData |
