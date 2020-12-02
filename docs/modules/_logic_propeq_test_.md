**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/propEq.test"

# Module: "logic/propEq.test"

## Index

### Variables

* [test](_logic_propeq_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`propEq\`, [ given(\`a key\`, [ it(\`returns a function\`, ({ equal }) => { const aProp = propEq('a') equal('function', typeof aProp) }), ]), given(\`a key and a value\`, [ it(\`returns a function\`, ({ equal }) => { const aPropIsOne = propEq('a', 1) equal('function', typeof aPropIsOne) }), ]), given(\`a key, value and object\`, [ it(\`returns true if object has same value at specified key\`, ({ ok }) => { interface Foo { readonly a: number readonly b: number } const testFoo: Foo = { a: 1, b: 2 } const aPropIsOne = propEq('a', 1) ok(aPropIsOne(testFoo)) }), it(\`returns false if object does not have same value at specified key\`, ({ notOk }) => { interface Foo { readonly a: number readonly b: number } const aPropIsOne = propEq('a', 1) const testFoo: Foo = { a: 2, b: 1 } notOk(aPropIsOne(testFoo)) }), ]),])

*Defined in [src/logic/propEq.test.ts:5](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/logic/propEq.test.ts#L5)*
