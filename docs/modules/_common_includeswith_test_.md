**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "common/includesWith.test"

# Module: "common/includesWith.test"

## Index

### Variables

* [test](_common_includeswith_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`includesWith\`, [ given(\`a predicate, a value, and a list\`, [ it(\`calls the predicate function with the given value and each element of the list\`, ({ same, }) => { const expectedValue = 1 const list: string[] = ['foo', 'bar', 'baz'] const predicate = (value: number, item: string, index: number) => !!same(expectedValue, value) && !!same(list[index], item) includesWith(predicate, expectedValue, list) }), ]),])

*Defined in [src/common/includesWith.test.ts:5](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/common/includesWith.test.ts#L5)*
