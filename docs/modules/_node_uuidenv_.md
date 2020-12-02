**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "node/UuidEnv"

# Module: "node/UuidEnv"

## Index

### Variables

* [provideUuidEnv](_node_uuidenv_.md#provideuuidenv)

### Object literals

* [uuidEnv](_node_uuidenv_.md#uuidenv)

## Variables

### provideUuidEnv

• `Const` **provideUuidEnv**: [Provider](_effect_provide_.md#provider)\<[UuidEnv](../interfaces/_uuid_common_.uuidenv.md)> = provideSome(uuidEnv)

*Defined in [src/node/UuidEnv.ts:20](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/UuidEnv.ts#L20)*

## Object literals

### uuidEnv

▪ `Const` **uuidEnv**: object

*Defined in [src/node/UuidEnv.ts:9](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/UuidEnv.ts#L9)*

A node-specific implementation of UuidEnv

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`randomUuidSeed` | function | () => [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] |
