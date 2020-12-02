**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getShared.test"

# Module: "Shared/core/services/getShared.test"

## Index

### Variables

* [test](_shared_core_services_getshared_test_.md#test)

### Functions

* [createKeyStores](_shared_core_services_getshared_test_.md#createkeystores)

## Variables

### test

• `Const` **test**: Test = describe(\`getShared\`, [ given(\`a Shared instance\`, [ it(\`returns the default value\`, ({ same }, done) => { const expected = {} const initial = Pure.of(expected) const state = createShared('test', initial) const sut = doEffect(function* () { try { const actual = yield* getShared(state) same(expected, actual) done() } catch (error) { done(error) } }) pipe(sut, provideSharedEnv, execPure) }), it(\`emits SharedValueCreated event when does not exist in store\`, ({ equal }, done) => { const initial = 0 const state = createShared('test', Pure.of(initial)) const { namespaceA, keyStores } = createKeyStores() const sharedEvents = createAdapter\<SharedEvent>() const expected: SharedValueCreated = { type: 'sharedValue/created', namespace: namespaceA, shared: state, value: initial, } runEffects( tap((event) => { try { equal(expected, event) done() } catch (error) { done(error) } }, sharedEvents[1]), newDefaultScheduler(), ) pipe( getShared(state), provideAll({ currentNamespace: namespaceA, sharedEvents, namespaceKeyStores: keyStores }), execPure, ) }), ]),])

*Defined in [src/Shared/core/services/getShared.test.ts:14](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/getShared.test.ts#L14)*

## Functions

### createKeyStores

▸ **createKeyStores**(): object

*Defined in [src/Shared/core/services/getShared.test.ts:70](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/getShared.test.ts#L70)*

**Returns:** object

Name | Type |
------ | ------ |
`keyStoreA` | [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<[Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>> |
`keyStoreB` | [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<[Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>> |
`keyStores` | [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)\<[Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<string \| number \| symbol>, any, any>>> |
`namespaceA` | [Namespace](_shared_core_model_namespace_.namespace.md) |
`namespaceB` | [Namespace](_shared_core_model_namespace_.namespace.md) |
