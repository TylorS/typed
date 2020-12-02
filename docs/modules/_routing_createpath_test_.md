**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/createPath.test"

# Module: "routing/createPath.test"

## Index

### Variables

* [test](_routing_createpath_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`createPath\`, [ given(\`a Route\`, [ it(\`returns (RouteValues -> Path)\`, ({ equal }) => { type FooBar = Route\<['foo', ':bar']> type Test = Route\<[FooBar, ':baz']> type Values = GetRouteValue\<Test> const values: Values = { bar: 'whatever', baz: 'example' } const test = createRoute\<Test>('/foo/:bar/:baz') const expected = Path.wrap(\`/foo/${values.bar}/${values.baz}\`) const createTestPath = createPath(test) const actual = createTestPath(values) equal(expected, actual) }), ]),])

*Defined in [src/routing/createPath.test.ts:7](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/routing/createPath.test.ts#L7)*
