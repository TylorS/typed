**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "routing/matchRoute.test"

# Module: "routing/matchRoute.test"

## Index

### Variables

* [test](_routing_matchroute_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`matchRoute\`, [ given(\`a Route\`, [ it(\`returns Match\<string, ValuesOf\<Route>>\`, ({ ok, equal }) => { type FooBar = Route\<['foo', ':bar']> type Test = Route\<[FooBar, ':baz']> type Values = GetRouteValue\<Test> const expected: Values = { bar: 'whatever', baz: 'example' } const test = createRoute\<Test>('/foo/:bar/:baz') const matchTest = matchRoute(test) const option = matchTest(\`/foo/${expected.bar}/${expected.baz}\`) ok(isSome(option)) equal(expected, (option as Some\<Values>).value) ok(isNone(matchTest('/anything/else'))) ok(isNone(matchTest('/else'))) }), ]),])

*Defined in [src/routing/matchRoute.test.ts:7](https://github.com/TylorS/typed-fp/blob/8639976/src/routing/matchRoute.test.ts#L7)*
