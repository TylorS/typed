**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/json.test"

# Module: "logic/json.test"

## Index

### Variables

* [test](_logic_json_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`toJson/fromJson\`, [ given(\`a Map\`, [ it(\`is properly serialized/deserialized\`, ({ equal }) => { const sut = { map: new Map([ [new Map([[1, 2]]), 2], [new Map([[2, 3]]), 3], ]), } const jsonString = toJson(sut) equal( '{"map":{"\_\_json\_tag\_\_":1,"\_\_values\_tag\_\_":[[{"\_\_json\_tag\_\_":1,"\_\_values\_tag\_\_":[[1,2]]},2],[{"\_\_json\_tag\_\_":1,"\_\_values\_tag\_\_":[[2,3]]},3]]}}', jsonString, ) const actual = fromJson(jsonString) equal(sut, actual) }), ]), given(\`a Set\`, [ it(\`is properly serialized/deserialized\`, ({ equal }) => { const sut = new Set([new Set([1, 2]), new Set([2, 3])]) const jsonString = toJson(sut) equal( \`{"\_\_json\_tag\_\_":0,"\_\_values\_tag\_\_":[{"\_\_json\_tag\_\_":0,"\_\_values\_tag\_\_":[1,2]},{"\_\_json\_tag\_\_":0,"\_\_values\_tag\_\_":[2,3]}]}\`, jsonString, ) const actual = fromJson(jsonString) equal(sut, actual) }), ]),])

*Defined in [src/logic/json.test.ts:5](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/logic/json.test.ts#L5)*
