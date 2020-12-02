**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/deleteShared.test"

# Module: "Shared/core/services/deleteShared.test"

## Index

### Variables

* [test](_shared_core_services_deleteshared_test_.md#test)

### Functions

* [createKeyStoresFrom](_shared_core_services_deleteshared_test_.md#createkeystoresfrom)

## Variables

### test

• `Const` **test**: Test = describe(\`deleteShared\`, [ given(\`a Shared value\`, [ it(\`deletes it from the key store\`, ({ ok, notOk }, done) => { const initial = 0 const state = createShared('test', Pure.of(initial)) const { namespaceA, keyStoreA, keyStores } = createKeyStoresFrom(state, initial) const sharedEvents = createAdapter() const sut = doEffect(function* () { try { ok(keyStoreA.has(state.key)) yield* deleteShared(state) notOk(keyStoreA.has(state.key)) done() } catch (error) { done(error) } }) pipe( sut, provideAll({ currentNamespace: namespaceA, namespaceKeyStores: keyStores, sharedEvents, }), execPure, ) }), it(\`deletes it from the key store\`, ({ ok, notOk, equal }, done) => { const initial = 0 const state = createShared('test', Pure.of(initial)) const { namespaceA, keyStoreA, keyStores } = createKeyStoresFrom(state, initial) const sharedEvents = createAdapter() const scheduler = newDefaultScheduler() const expected: SharedValueDeleted = { type: 'sharedValue/deleted', namespace: namespaceA, shared: state, } runEffects( tap((event) => { try { equal(expected, event) done() } catch (error) { done(error) } }, sharedEvents[1]), scheduler, ) const sut = doEffect(function* () { try { ok(keyStoreA.has(state.key)) yield* deleteShared(state) notOk(keyStoreA.has(state.key)) } catch (error) { done(error) } }) pipe( sut, provideAll({ currentNamespace: namespaceA, namespaceKeyStores: keyStores, sharedEvents, }), execPure, ) }), ]),])

*Defined in [src/Shared/core/services/deleteShared.test.ts:14](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/core/services/deleteShared.test.ts#L14)*

## Functions

### createKeyStoresFrom

▸ **createKeyStoresFrom**\<S>(`state`: S, `initial`: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>): object

*Defined in [src/Shared/core/services/deleteShared.test.ts:92](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/core/services/deleteShared.test.ts#L92)*

#### Type parameters:

Name | Type |
------ | ------ |
`S` | [Shared](_shared_core_model_shared_.shared.md) |

#### Parameters:

Name | Type |
------ | ------ |
`state` | S |
`initial` | [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S> |

**Returns:** object

Name | Type |
------ | ------ |
`keyStoreA` | [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<S> |
`keyStoreB` | [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<S> |
`keyStores` | [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<S>> |
`namespaceA` | [Namespace](_shared_core_model_namespace_.namespace.md) |
`namespaceB` | [Namespace](_shared_core_model_namespace_.namespace.md) |
