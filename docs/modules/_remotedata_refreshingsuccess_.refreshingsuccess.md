**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["RemoteData/RefreshingSuccess"](_remotedata_refreshingsuccess_.md) / RefreshingSuccess

# Namespace: RefreshingSuccess\<A>

A RemoteData state in which the previous request succeeded with some value A,
but we are currently attempting to load a new response.

## Type parameters

Name |
------ |
`A` |

## Index

### Properties

* [progress](_remotedata_refreshingsuccess_.refreshingsuccess.md#progress)
* [status](_remotedata_refreshingsuccess_.refreshingsuccess.md#status)
* [value](_remotedata_refreshingsuccess_.refreshingsuccess.md#value)

### Functions

* [of](_remotedata_refreshingsuccess_.refreshingsuccess.md#of)

## Properties

### progress

• `Readonly` **progress**: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>

*Defined in [src/RemoteData/RefreshingSuccess.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingSuccess.ts#L13)*

___

### status

• `Readonly` **status**: [RefreshingSuccess](../enums/_remotedata_enums_.remotedatastatus.md#refreshingsuccess)

*Defined in [src/RemoteData/RefreshingSuccess.ts:11](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingSuccess.ts#L11)*

___

### value

• `Readonly` **value**: A

*Defined in [src/RemoteData/RefreshingSuccess.ts:12](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingSuccess.ts#L12)*

## Functions

### of

▸ `Const`**of**\<A>(`value`: A, `progress?`: [Progress](../interfaces/_remotedata_progress_.progress.md)): [RefreshingSuccess](_remotedata_refreshingsuccess_.refreshingsuccess.md)\<A>

*Defined in [src/RemoteData/RefreshingSuccess.ts:17](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/RefreshingSuccess.ts#L17)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`value` | A |
`progress?` | [Progress](../interfaces/_remotedata_progress_.progress.md) |

**Returns:** [RefreshingSuccess](_remotedata_refreshingsuccess_.refreshingsuccess.md)\<A>
