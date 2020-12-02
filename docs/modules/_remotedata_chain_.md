**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/chain"

# Module: "RemoteData/chain"

## Index

### Variables

* [chain](_remotedata_chain_.md#chain)

### Functions

* [\_\_chain](_remotedata_chain_.md#__chain)

## Variables

### chain

• `Const` **chain**: \<A, B, C>(f: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>, data: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>\<A, B, C>(f: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>) => (data: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C> = curry(\_\_chain) as { \<A, B, C>( f: (value: B, info: SuccessInfo) => RemoteData\<A, C>, data: RemoteData\<A, B>, ): RemoteData\<A, C> \<A, B, C>(f: (value: B, info: SuccessInfo) => RemoteData\<A, C>): ( data: RemoteData\<A, B>, ) => RemoteData\<A, C>}

*Defined in [src/RemoteData/chain.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/chain.ts#L13)*

Returns a `RemoteData` that is the result of calling `f` with the resolved
value of another `RemoteData`.

## Functions

### \_\_chain

▸ **__chain**\<A, B, C>(`f`: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>, `data`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>

*Defined in [src/RemoteData/chain.ts:23](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/RemoteData/chain.ts#L23)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C> |
`data` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>
