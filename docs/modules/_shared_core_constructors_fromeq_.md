**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/constructors/fromEq"

# Module: "Shared/core/constructors/fromEq"

## Index

### Variables

* [fromEq](_shared_core_constructors_fromeq_.md#fromeq)

## Variables

### fromEq

• `Const` **fromEq**: \<A, K>(eq: Eq\<A>, key: K) => [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<K>, Record\<K, A>, A>\<A>(eq: Eq\<A>) => \<K>(key: K) => [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<K>, Record\<K, A>, A> = curry( \<A, K extends PropertyKey>(eq: Eq\<A>, key: K): Shared\<SharedKey\<K>, Record\<K, A>, A> => createShared( key, asks((e: Record\<K, A>) => Reflect.get(e, key)), eq, ),) as { \<A, K extends PropertyKey>(eq: Eq\<A>, key: K): Shared\<SharedKey\<K>, Record\<K, A>, A> \<A>(eq: Eq\<A>): \<K extends PropertyKey>(key: K) => Shared\<SharedKey\<K>, Record\<K, A>, A>}

*Defined in [src/Shared/core/constructors/fromEq.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/core/constructors/fromEq.ts#L12)*

Creates a Shared instance given an Eq instance and a key.
