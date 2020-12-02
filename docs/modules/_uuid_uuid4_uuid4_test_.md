**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Uuid/uuid4/uuid4.test"

# Module: "Uuid/uuid4/uuid4.test"

## Index

### Variables

* [test](_uuid_uuid4_uuid4_test_.md#test)

### Functions

* [createUuidArray](_uuid_uuid4_uuid4_test_.md#createuuidarray)

## Variables

### test

• `Const` **test**: Test = describe(\`uuid4\`, [ given(\`[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]\`, [ it(\`returns\`, ({ equal }) => { const expected = Uuid.wrap('1234-56-478-89a-bcdef10') equal(expected, uuid4(createUuidArray())) }), ]),])

*Defined in [src/Uuid/uuid4/uuid4.test.ts:6](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uuid/uuid4/uuid4.test.ts#L6)*

## Functions

### createUuidArray

▸ **createUuidArray**(): [UuidSeed](_uuid_common_.md#uuidseed)

*Defined in [src/Uuid/uuid4/uuid4.test.ts:16](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Uuid/uuid4/uuid4.test.ts#L16)*

**Returns:** [UuidSeed](_uuid_common_.md#uuidseed)
