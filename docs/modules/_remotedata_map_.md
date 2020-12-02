**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/map"

# Module: "RemoteData/map"

## Index

### Variables

* [map](_remotedata_map_.md#map)

### Functions

* [\_\_map](_remotedata_map_.md#__map)

## Variables

### map

• `Const` **map**: \<A, B, C>(f: (value: B, successInfo: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C, data: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>\<A, B, C>(f: (value: B, successInfo: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C) => (data: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C> = curry(\_\_map) as { \<A, B, C>(f: (value: B, successInfo: SuccessInfo) => C, data: RemoteData\<A, B>): RemoteData\<A, C> \<A, B, C>(f: (value: B, successInfo: SuccessInfo) => C): ( data: RemoteData\<A, B>, ) => RemoteData\<A, C>}

*Defined in [src/RemoteData/map.ts:14](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/map.ts#L14)*

Map over the value of a successful RemoteData.

## Functions

### \_\_map

▸ **__map**\<A, B, C>(`f`: (value: B, successInfo: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C, `data`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>

*Defined in [src/RemoteData/map.ts:21](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/map.ts#L21)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (value: B, successInfo: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C |
`data` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>
