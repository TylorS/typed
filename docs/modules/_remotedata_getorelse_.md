**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "RemoteData/getOrElse"

# Module: "RemoteData/getOrElse"

## Index

### Variables

* [getOrElse](_remotedata_getorelse_.md#getorelse)

## Variables

### getOrElse

• `Const` **getOrElse**: \<A, B, C>(ioa: Lazy\<A>, rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<B, C>) => A \| C\<A>(ioa: Lazy\<A>) => \<B, C>(rd: [RemoteData](_remotedata_remotedata_.md#remotedata)\<B, C>) => A \| C = curry(\<A, B, C>(ioa: Lazy\<A>, rd: RemoteData\<B, C>): A \| C => isSuccessful(rd) ? rd.value : ioa(),) as { \<A, B, C>(ioa: Lazy\<A>, rd: RemoteData\<B, C>): A \| C \<A>(ioa: Lazy\<A>): \<B, C>(rd: RemoteData\<B, C>) => A \| C}

*Defined in [src/RemoteData/getOrElse.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/RemoteData/getOrElse.ts#L10)*

Get the value contained within a successful RemoteData or return the lazy value.
