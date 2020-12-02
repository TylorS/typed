**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Uri/addQueryParameters.test"

# Module: "Uri/addQueryParameters.test"

## Index

### Variables

* [test](_uri_addqueryparameters_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`addQueryParameters\`, [ given(\`a url and a Record of query parameters\`, [ it(\`returns a url with query parameters appended\`, ({ equal }) => { const url = Uri.wrap(\`https://example.com/\`) const params = { hello: 'world', foo: 'bar', } const expected = Uri.wrap(\`${url}?foo=bar&hello=world\`) const actual = addQueryParameters(url, params) equal(expected, actual) }), ]),])

*Defined in [src/Uri/addQueryParameters.test.ts:5](https://github.com/TylorS/typed-fp/blob/41076ce/src/Uri/addQueryParameters.test.ts#L5)*
