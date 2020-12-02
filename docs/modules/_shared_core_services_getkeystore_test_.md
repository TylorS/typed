**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getKeyStore.test"

# Module: "Shared/core/services/getKeyStore.test"

## Index

### Variables

* [keyStoreA](_shared_core_services_getkeystore_test_.md#keystorea)
* [keyStoreB](_shared_core_services_getkeystore_test_.md#keystoreb)
* [keyStores](_shared_core_services_getkeystore_test_.md#keystores)
* [namespaceA](_shared_core_services_getkeystore_test_.md#namespacea)
* [namespaceB](_shared_core_services_getkeystore_test_.md#namespaceb)
* [test](_shared_core_services_getkeystore_test_.md#test)

## Variables

### keyStoreA

• `Const` **keyStoreA**: [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md) = new Map()

*Defined in [src/Shared/core/services/getKeyStore.test.ts:14](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L14)*

___

### keyStoreB

• `Const` **keyStoreB**: [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md) = new Map()

*Defined in [src/Shared/core/services/getKeyStore.test.ts:17](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L17)*

___

### keyStores

• `Const` **keyStores**: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<[Namespace](_shared_core_model_namespace_.namespace.md), [SharedKeyStore](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md)> = new Map([ [namespaceA, keyStoreA], [namespaceB, keyStoreB],])

*Defined in [src/Shared/core/services/getKeyStore.test.ts:19](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L19)*

___

### namespaceA

• `Const` **namespaceA**: [Namespace](_shared_core_model_namespace_.namespace.md) = Namespace.wrap('a')

*Defined in [src/Shared/core/services/getKeyStore.test.ts:13](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L13)*

___

### namespaceB

• `Const` **namespaceB**: [Namespace](_shared_core_model_namespace_.namespace.md) = Namespace.wrap('b')

*Defined in [src/Shared/core/services/getKeyStore.test.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L16)*

___

### test

• `Const` **test**: Test = describe(\`getKeyStore\`, [ given(\`a SharedEnv\`, [ it(\`returns the current keyStore\`, ({ same }, done) => { const sut = doEffect(function* () { try { const a = yield* pipe(getKeyStore, usingNamespace(namespaceA)) same(keyStoreA, a) const b = yield* pipe(getKeyStore, usingNamespace(namespaceB)) same(keyStoreB, b) done() } catch (error) { done(error) } }) pipe( sut, provideAll({ currentNamespace: namespaceA, namespaceKeyStores: keyStores, sharedEvents: createAdapter(), }), execPure, ) }), it(\`emits NamespaceCreated event when creating a new keyStore\`, ({ equal }, done) => { const sharedEvents = createAdapter() const namespace = Namespace.wrap('test') const scheduler = newDefaultScheduler() const expected: NamespaceCreated = { type: 'namespace/created', namespace } runEffects( tap((event) => { try { equal(expected, event) done() } catch (error) { done(error) } }, sharedEvents[1]), scheduler, ) pipe( getKeyStore, provideAll({ currentNamespace: namespace, namespaceKeyStores: keyStores, sharedEvents, }), execPure, ) }), ]),])

*Defined in [src/Shared/core/services/getKeyStore.test.ts:24](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/services/getKeyStore.test.ts#L24)*
