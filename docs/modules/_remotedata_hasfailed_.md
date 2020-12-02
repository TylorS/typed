**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/hasFailed"

# Module: "RemoteData/hasFailed"

## Index

### Functions

* [hasFailed](_remotedata_hasfailed_.md#hasfailed)

## Functions

### hasFailed

▸ `Const`**hasFailed**\<A, B>(`rd`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): rd is Failure\<A> \| RefreshingFailure\<A>

*Defined in [src/RemoteData/hasFailed.ts:10](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/hasFailed.ts#L10)*

RemoteData is Failure or RefreshingFailure

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`rd` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** rd is Failure\<A> \| RefreshingFailure\<A>
