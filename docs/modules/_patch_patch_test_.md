**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/patch.test"

# Module: "Patch/patch.test"

## Index

### Variables

* [test](_patch_patch_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`Patching\`, [ it(\`patches namespace given a RenderRef\`, ({ equal }, done) => { const namespaceB = Namespace.wrap('b') const value = 1 const component = doEffect(function* () { const ref = yield* getRenderRef\<number>() if (isUndefined(ref.current) \|\| isUndefined(ref.current)) { ref.current = value } return value }) const test = doEffect(function* () { try { equal(value, yield* runWithNamespace(namespaceB, component)) const updated = yield* pipe(getRenderRef(), usingNamespace(namespaceB)) equal(value, updated.current) yield* sendSharedEvent({ type: 'namespace/updated', namespace: namespaceB }) equal(value * 2, updated.current) yield* sendSharedEvent({ type: 'namespace/updated', namespace: namespaceB }) equal(value * 3, updated.current) done() } catch (error) { done(error) } }) const patch: Patch\<number, number> = { patch: (x, y) => sync(x + y), } pipe( test, createSharedEnvProvider({ namespace: Namespace.wrap('a'), handlers: [...defaultHandlers, ...createRenderHandlers(patch)], }), provideSchedulerEnv, execPure, ) }),])

*Defined in [src/Patch/patch.test.ts:22](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/patch.test.ts#L22)*
