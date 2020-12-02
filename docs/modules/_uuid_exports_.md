**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Uuid/exports"

# Module: "Uuid/exports"

## Index

### References

* [Uuid](_uuid_exports_.md#uuid)
* [UuidEnv](_uuid_exports_.md#uuidenv)
* [UuidSeed](_uuid_exports_.md#uuidseed)
* [VALID\_UUID\_LENGTH](_uuid_exports_.md#valid_uuid_length)
* [uuid4](_uuid_exports_.md#uuid4)

### Variables

* [createUuid](_uuid_exports_.md#createuuid)
* [uuidPrism](_uuid_exports_.md#uuidprism)
* [uuidRegex](_uuid_exports_.md#uuidregex)

## References

### Uuid

Re-exports: [Uuid](_uuid_common_.uuid.md)

___

### UuidEnv

Re-exports: [UuidEnv](../interfaces/_uuid_common_.uuidenv.md)

___

### UuidSeed

Re-exports: [UuidSeed](_uuid_common_.md#uuidseed)

___

### VALID\_UUID\_LENGTH

Re-exports: [VALID\_UUID\_LENGTH](_uuid_common_.md#valid_uuid_length)

___

### uuid4

Re-exports: [uuid4](_uuid_uuid4_uuid4_.md#uuid4)

## Variables

### createUuid

• `Const` **createUuid**: [Effect](_effect_effect_.effect.md)\<[UuidEnv](../interfaces/_uuid_common_.uuidenv.md), [Uuid](_uuid_common_.uuid.md)> = pipe( ask\<UuidEnv>(), map((e) => e.randomUuidSeed()), map(uuid4),)

*Defined in [src/Uuid/exports.ts:21](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Uuid/exports.ts#L21)*

Effect for creating a Uuid

___

### uuidPrism

• `Const` **uuidPrism**: Prism\<string, [Uuid](_uuid_common_.uuid.md)> = prism\<Uuid>((s) => uuidRegex.test(s))

*Defined in [src/Uuid/exports.ts:16](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Uuid/exports.ts#L16)*

Prism instance for a Uuid.

___

### uuidRegex

• `Const` **uuidRegex**: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

*Defined in [src/Uuid/exports.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Uuid/exports.ts#L11)*

Regex to validate a UUID
