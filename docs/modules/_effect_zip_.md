**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/zip"

# Module: "Effect/zip"

## Index

### Type aliases

* [ZipEffects](_effect_zip_.md#zipeffects)
* [ZipEnvOf](_effect_zip_.md#zipenvof)
* [ZipReturnOf](_effect_zip_.md#zipreturnof)

### Variables

* [zip](_effect_zip_.md#zip)
* [zipSeq](_effect_zip_.md#zipseq)

## Type aliases

### ZipEffects

Ƭ  **ZipEffects**: \<A>(effects: A) => [Effect](_effect_effect_.effect.md)\<[ZipEnvOf](_effect_zip_.md#zipenvof)\<A>, [ZipReturnOf](_effect_zip_.md#zipreturnof)\<A>>

*Defined in [src/Effect/zip.ts:16](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/zip.ts#L16)*

___

### ZipEnvOf

Ƭ  **ZipEnvOf**\<A>: A *extends* ReadonlyArray\<Effect\<*infer* R, any>> ? R : never

*Defined in [src/Effect/zip.ts:20](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/zip.ts#L20)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<[Effect](_effect_effect_.effect.md)\<any, any>> |

___

### ZipReturnOf

Ƭ  **ZipReturnOf**\<A>: {}

*Defined in [src/Effect/zip.ts:26](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/zip.ts#L26)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<[Effect](_effect_effect_.effect.md)\<any, any>> |

## Variables

### zip

• `Const` **zip**: [ZipEffects](_effect_zip_.md#zipeffects) = (readonlyArray.sequence(effect) as unknown) as ZipEffects

*Defined in [src/Effect/zip.ts:9](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/zip.ts#L9)*

Sequence together some number of Effects into an array of all of their values in parallel.

___

### zipSeq

• `Const` **zipSeq**: [ZipEffects](_effect_zip_.md#zipeffects) = (readonlyArray.sequence(effectSeq) as unknown) as ZipEffects

*Defined in [src/Effect/zip.ts:14](https://github.com/TylorS/typed-fp/blob/559f273/src/Effect/zip.ts#L14)*

Sequence together some number of Effects into an array of all of their values in sequential order.
