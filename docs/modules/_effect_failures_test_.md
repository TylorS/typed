**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/failures.test"

# Module: "Effect/failures.test"

## Index

### Variables

* [test](_effect_failures_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`failures\`, [ describe(\`fail\`, [ it(\`allows failing\`, ({ equal }, done) => { const key = 'test' const error = 'fail' const sut = doEffect(function* () { yield* fail(key, error) }) pipe( sut, catchError(key, (e: string) => { try { equal(e, error) done() } catch (error) { done(error) } }), execPure, ) }), ]), describe(\`catchError\`, [ it(\`allows handling errors\`, ({ equal }, done) => { const key = 'test' const error = 'fail' const expected = 10 const child = doEffect(function* () { const { value } = yield* ask\<{ value: number }>() yield* fail(key, error) return value }) const parent = doEffect(function* () { const n = yield* catchError(key, () => expected, child) try { equal(expected, n) done() } catch (error) { done(error) } }) pipe(parent, execEffect({ value: 5 })) }), ]),])

*Defined in [src/Effect/failures.test.ts:9](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/failures.test.ts#L9)*
