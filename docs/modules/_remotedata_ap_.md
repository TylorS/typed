**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/ap"

# Module: "RemoteData/ap"

## Index

### Variables

* [ap](_remotedata_ap_.md#ap)

### Functions

* [\_\_ap](_remotedata_ap_.md#__ap)

## Variables

### ap

• `Const` **ap**: \<A, B, C>(fn: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C>, value: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>\<A, B, C>(fn: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C>) => (value: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C> = curry(\_\_ap) as { \<A, B, C>( fn: RemoteData\<A, (value: B, info: SuccessInfo) => C>, value: RemoteData\<A, B>, ): RemoteData\<A, C> \<A, B, C>(fn: RemoteData\<A, (value: B, info: SuccessInfo) => C>): ( value: RemoteData\<A, B>, ) => RemoteData\<A, C>}

*Defined in [src/RemoteData/ap.ts:12](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/ap.ts#L12)*

Applies the function contains in an `RemoteData` to the value contained in a
second `RemoteData`.

## Functions

### \_\_ap

▸ **__ap**\<A, B, C>(`fn`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C>, `value`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>

*Defined in [src/RemoteData/ap.ts:22](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/RemoteData/ap.ts#L22)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`fn` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C> |
`value` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>
