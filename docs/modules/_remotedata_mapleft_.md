**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/mapLeft"

# Module: "RemoteData/mapLeft"

## Index

### Variables

* [mapLeft](_remotedata_mapleft_.md#mapleft)

## Variables

### mapLeft

• `Const` **mapLeft**: \<A, B, C>(f: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => B, rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<B, C>\<A, B>(f: (value: A, info: [FailureInfo](_remotedata_fold_.md#failureinfo)) => B) => \<C>(rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<A, C>) => [RemoteData](_remotedata_remotedata_.md#remotedata)\<B, C> = curry( \<A, B, C>(f: (value: A, info: FailureInfo) => B, rd: RemoteData\<A, C>): RemoteData\<B, C> => { if (isRefreshingFailure(rd)) { return RefreshingFailure.of(f(rd.value, { refreshing: true, progress: rd.progress })) } if (isFailure(rd)) { return Failure.of(f(rd.value, { refreshing: false, progress: none })) } return rd },) as { \<A, B, C>(f: (value: A, info: FailureInfo) => B, rd: RemoteData\<A, C>): RemoteData\<B, C> \<A, B>(f: (value: A, info: FailureInfo) => B): \<C>(rd: RemoteData\<A, C>) => RemoteData\<B, C>}

*Defined in [src/RemoteData/mapLeft.ts:14](https://github.com/TylorS/typed-fp/blob/f129829/src/RemoteData/mapLeft.ts#L14)*

Map over the failure state of a RemoteData type.
