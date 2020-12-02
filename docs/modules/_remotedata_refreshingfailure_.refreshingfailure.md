**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["RemoteData/RefreshingFailure"](_remotedata_refreshingfailure_.md) / RefreshingFailure

# Namespace: RefreshingFailure\<A>

A RemoteData state in which the previous request failure with some failure A,
but we are currently attempting to load a new response.

## Type parameters

Name |
------ |
`A` |

## Index

### Properties

* [progress](_remotedata_refreshingfailure_.refreshingfailure.md#progress)
* [status](_remotedata_refreshingfailure_.refreshingfailure.md#status)
* [value](_remotedata_refreshingfailure_.refreshingfailure.md#value)

### Functions

* [of](_remotedata_refreshingfailure_.refreshingfailure.md#of)

## Properties

### progress

• `Readonly` **progress**: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>

*Defined in [src/RemoteData/RefreshingFailure.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingFailure.ts#L13)*

___

### status

• `Readonly` **status**: [RefreshingFailure](../enums/_remotedata_enums_.remotedatastatus.md#refreshingfailure)

*Defined in [src/RemoteData/RefreshingFailure.ts:11](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingFailure.ts#L11)*

___

### value

• `Readonly` **value**: A

*Defined in [src/RemoteData/RefreshingFailure.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingFailure.ts#L12)*

## Functions

### of

▸ `Const`**of**\<A>(`value`: A, `progress?`: [Progress](../interfaces/_remotedata_progress_.progress.md)): [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<A>

*Defined in [src/RemoteData/RefreshingFailure.ts:17](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingFailure.ts#L17)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |
`progress?` | [Progress](../interfaces/_remotedata_progress_.progress.md) |

**Returns:** [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<A>
