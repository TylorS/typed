**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "browser/UuidEnv"

# Module: "browser/UuidEnv"

## Index

### Variables

* [provideUuidEnv](_browser_uuidenv_.md#provideuuidenv)

### Object literals

* [uuidEnv](_browser_uuidenv_.md#uuidenv)

## Variables

### provideUuidEnv

• `Const` **provideUuidEnv**: [Provider](_effect_provide_.md#provider)\<[UuidEnv](../interfaces/_uuid_common_.uuidenv.md)> = provideSome(uuidEnv)

*Defined in [src/browser/UuidEnv.ts:16](https://github.com/TylorS/typed-fp/blob/8639976/src/browser/UuidEnv.ts#L16)*

Provide an Effect with a UuidEnv using WebCrypto.

## Object literals

### uuidEnv

▪ `Const` **uuidEnv**: object

*Defined in [src/browser/UuidEnv.ts:8](https://github.com/TylorS/typed-fp/blob/8639976/src/browser/UuidEnv.ts#L8)*

Browser implementation of UuidEnv using native WebCrypto API to retrieve cryptographically-safe
random numbers to generate real UUIDs in the browser.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`randomUuidSeed` | function | () => [UuidSeed](_uuid_common_.md#uuidseed) |
