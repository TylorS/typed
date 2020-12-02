**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/modifyShared.test"

# Module: "Shared/core/services/modifyShared.test"

## Index

### Variables

* [test](_shared_core_services_modifyshared_test_.md#test)

### Functions

* [createKeyStoresFrom](_shared_core_services_modifyshared_test_.md#createkeystoresfrom)

## Variables

### test

• `Const` **test**: Test = describe(\`modifyShared\`, [ given(\`a Shared value and an update function\`, [ it(\`returns the most up to date state\`, ({ equal }, done) => { const initial = 0 const state = createShared('test', Pure.of(initial)) const sut = doEffect(function* () { try { equal(initial, yield* getShared(state)) equal(initial + 1, yield* modifyShared(state, (x) => x + 1)) done() } catch (error) { done(error) } }) pipe(sut, provideSharedEnv, execPure) }), it(\`emits a SharedValueUpdated event\`, ({ equal }, done) => { const initial = 0 const state = createShared('test', Pure.of(initial)) const { namespaceA, keyStores } = createKeyStoresFrom(state, initial) const sharedEvents = createAdapter() const scheduler = newDefaultScheduler() const expected: SharedValueUpdated = { type: 'sharedValue/updated', namespace: namespaceA, shared: state, previousValue: 0, value: 1, } runEffects( tap((event) => { try { equal(expected, event) done() } catch (error) { done(error) } }, sharedEvents[1]), scheduler, ) const sut = doEffect(function* () { try { equal(initial + 1, yield* modifyShared(state, (x) => x + 1)) } catch (error) { done(error) } }) pipe( sut, provideAll({ currentNamespace: namespaceA, namespaceKeyStores: keyStores, sharedEvents, }), execPure, ) }), ]),])

*Defined in [src/Shared/core/services/modifyShared.test.ts:16](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/services/modifyShared.test.ts#L16)*

## Functions

### createKeyStoresFrom

▸ **createKeyStoresFrom**\<S>(`state`: S, `initial`: [GetSharedValue](_shared_core_model_shared_.md#getsharedvalue)\<S>): object

*Defined in [src/Shared/core/services/modifyShared.test.ts:85](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Shared/core/services/modifyShared.test.ts#L85)*

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
