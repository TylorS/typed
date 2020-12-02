**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/isSuccessful"

# Module: "RemoteData/isSuccessful"

## Index

### Functions

* [isSuccessful](_remotedata_issuccessful_.md#issuccessful)

## Functions

### isSuccessful

▸ `Const`**isSuccessful**\<A, B>(`rd`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): rd is Success\<B> \| RefreshingSuccess\<B>

*Defined in [src/RemoteData/isSuccessful.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/isSuccessful.ts#L10)*

Check if RemoteData is Success or RefreshingSuccess

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`rd` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** rd is Success\<B> \| RefreshingSuccess\<B>
