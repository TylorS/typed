**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/toLoading"

# Module: "RemoteData/toLoading"

## Index

### Functions

* [toLoading](_remotedata_toloading_.md#toloading)

## Functions

### toLoading

▸ `Const`**toLoading**\<A, B>(`rd`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading) \| [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<A> \| [RefreshingSuccess](_remotedata_refreshingsuccess_.refreshingsuccess.md)\<B>

*Defined in [src/RemoteData/toLoading.ts:12](https://github.com/TylorS/typed-fp/blob/41076ce/src/RemoteData/toLoading.ts#L12)*

Transition a RemoteData into a Loading state.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`rd` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** [Loading](../enums/_remotedata_enums_.remotedatastatus.md#loading) \| [RefreshingFailure](_remotedata_refreshingfailure_.refreshingfailure.md)\<A> \| [RefreshingSuccess](_remotedata_refreshingsuccess_.refreshingsuccess.md)\<B>
