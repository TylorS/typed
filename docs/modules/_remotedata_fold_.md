**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/fold"

# Module: "RemoteData/fold"

## Index

### Type aliases

* [FailureInfo](_remotedata_fold_.md#failureinfo)
* [SuccessInfo](_remotedata_fold_.md#successinfo)

### Variables

* [fold](_remotedata_fold_.md#fold)

### Functions

* [\_\_foldRemoteData](_remotedata_fold_.md#__foldremotedata)

## Type aliases

### FailureInfo

Ƭ  **FailureInfo**: { progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> ; refreshing: boolean  }

*Defined in [src/RemoteData/fold.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/fold.ts#L12)*

#### Type declaration:

Name | Type |
------ | ------ |
`progress` | Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> |
`refreshing` | boolean |

___

### SuccessInfo

Ƭ  **SuccessInfo**: { progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> ; refreshing: boolean  }

*Defined in [src/RemoteData/fold.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/fold.ts#L17)*

#### Type declaration:

Name | Type |
------ | ------ |
`progress` | Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)> |
`refreshing` | boolean |

## Variables

### fold

• `Const` **fold**: \<R1, R2, A, R3, B, R4>(noData: () => R1, loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R1, R2, A, R3, B, R4>(noData: () => R1, loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R1, R2, A, R3>(noData: () => R1, loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3) => \<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R1, R2>(noData: () => R1, loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2) => \<A, R3, B, R4>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<A, R3, B, R4>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<A, R3>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3) => \<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R1>(noData: () => R1) => \<R2, A, R3, B, R4>(loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R2, A, R3, B, R4>(loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R2, A, R3>(loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2, failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3) => \<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<R2>(loading: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => R2) => \<A, R3, B, R4>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<A, R3, B, R4>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3, success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<A, R3>(failure: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => R3) => \<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4, remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4\<B, R4>(success: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => R4) => (remoteData: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>) => R1 \| R2 \| R3 \| R4 = curry(\_\_foldRemoteData) as { \<R1, R2, A, R3, B, R4>( noData: () => R1, loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>, ): R1 \| R2 \| R3 \| R4 \<R1, R2, A, R3, B, R4>( noData: () => R1, loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, ): (remoteData: RemoteData\<A, B>) => R1 \| R2 \| R3 \| R4 \<R1, R2, A, R3>( noData: () => R1, loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, ): { \<B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>): \| R1 \| R2 \| R3 \| R4 \<B, R4>(success: (value: B, info: SuccessInfo) => R4): ( remoteData: RemoteData\<A, B>, ) => R1 \| R2 \| R3 \| R4 } \<R1, R2>(noData: () => R1, loading: (progress: Option\<Progress>) => R2): { \<A, R3, B, R4>( failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>, ): R1 \| R2 \| R3 \| R4 \<A, R3, B, R4>( failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, ): (remoteData: RemoteData\<A, B>) => R1 \| R2 \| R3 \| R4 \<A, R3>(failure: (value: A, info: FailureInfo) => R3): { \<B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>): \| R1 \| R2 \| R3 \| R4 \<B, R4>(success: (value: B, info: SuccessInfo) => R4): ( remoteData: RemoteData\<A, B>, ) => R1 \| R2 \| R3 \| R4 } } \<R1>(noData: () => R1): { \<R2, A, R3, B, R4>( loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>, ): R1 \| R2 \| R3 \| R4 \<R2, A, R3, B, R4>( loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, ): (remoteData: RemoteData\<A, B>) => R1 \| R2 \| R3 \| R4 \<R2, A, R3>( loading: (progress: Option\<Progress>) => R2, failure: (value: A, info: FailureInfo) => R3, ): { \<B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>): \| R1 \| R2 \| R3 \| R4 \<B, R4>(success: (value: B, info: SuccessInfo) => R4): ( remoteData: RemoteData\<A, B>, ) => R1 \| R2 \| R3 \| R4 } \<R2>(loading: (progress: Option\<Progress>) => R2): { \<A, R3, B, R4>( failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>, ): R1 \| R2 \| R3 \| R4 \<A, R3, B, R4>( failure: (value: A, info: FailureInfo) => R3, success: (value: B, info: SuccessInfo) => R4, ): (remoteData: RemoteData\<A, B>) => R1 \| R2 \| R3 \| R4 \<A, R3>(failure: (value: A, info: FailureInfo) => R3): { \<B, R4>(success: (value: B, info: SuccessInfo) => R4, remoteData: RemoteData\<A, B>): \| R1 \| R2 \| R3 \| R4 \<B, R4>(success: (value: B, info: SuccessInfo) => R4): ( remoteData: RemoteData\<A, B>, ) => R1 \| R2 \| R3 \| R4 } } }}

*Defined in [src/RemoteData/fold.ts:25](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/fold.ts#L25)*

Fold over a RemoteData value.

## Functions

### \_\_foldRemoteData

▸ **__foldRemoteData**\<A, B, C>(`noData`: () => C, `loading`: (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => C, `failure`: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => C, `success`: (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C, `remoteData`: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B>): C

*Defined in [src/RemoteData/fold.ts:138](https://github.com/TylorS/typed-fp/blob/8639976/src/RemoteData/fold.ts#L138)*

#### Type parameters:

Name |
------ |
`A` |
`B` |
`C` |

#### Parameters:

Name | Type |
------ | ------ |
`noData` | () => C |
`loading` | (progress: Option\<[Progress](../interfaces/_remotedata_progress_.progress.md)>) => C |
`failure` | (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => C |
`success` | (value: B, info: [SuccessInfo](_remotedata_fold_.md#successinfo)) => C |
`remoteData` | [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, B> |

**Returns:** C
