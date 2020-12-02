**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/zipObj"

# Module: "Effect/zipObj"

## Index

### Type aliases

* [ZipObjEffect](_effect_zipobj_.md#zipobjeffect)
* [ZipObjEnvOf](_effect_zipobj_.md#zipobjenvof)
* [ZipObjReturnOf](_effect_zipobj_.md#zipobjreturnof)

### Functions

* [zipObj](_effect_zipobj_.md#zipobj)

## Type aliases

### ZipObjEffect

Ƭ  **ZipObjEffect**\<A>: [Effect](_effect_effect_.effect.md)\<[ZipObjEnvOf](_effect_zipobj_.md#zipobjenvof)\<A>, [ZipObjReturnOf](_effect_zipobj_.md#zipobjreturnof)\<A>>

*Defined in [src/Effect/zipObj.ts:27](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/zipObj.ts#L27)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | Readonly\<Record\<PropertyKey, [Effect](_effect_effect_.effect.md)\<any, any>>> |

___

### ZipObjEnvOf

Ƭ  **ZipObjEnvOf**\<A>: [And](_common_and_.md#and)\<U.ListOf\<{}[keyof A]>>

*Defined in [src/Effect/zipObj.ts:32](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/zipObj.ts#L32)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | Readonly\<Record\<PropertyKey, [Effect](_effect_effect_.effect.md)\<any, any>>> |

___

### ZipObjReturnOf

Ƭ  **ZipObjReturnOf**\<A>: {}

*Defined in [src/Effect/zipObj.ts:40](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/zipObj.ts#L40)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | Readonly\<Record\<PropertyKey, [Effect](_effect_effect_.effect.md)\<any, any>>> |

## Functions

### zipObj

▸ **zipObj**\<A>(`effects`: A): [ZipObjEffect](_effect_zipobj_.md#zipobjeffect)\<A>

*Defined in [src/Effect/zipObj.ts:17](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/zipObj.ts#L17)*

Convert an Object of Effects into an Effect of an Object.

**`example`** 
const foo: Pure<{a: number, b:number, c: number }> = zipObj({
  a: Pure.of(1),
  b: Pure.of(2),
  c: Pure.of(3)
})

#### Type parameters:

Name | Type |
------ | ------ |
`A` | Readonly\<Record\<PropertyKey, [Effect](_effect_effect_.effect.md)\<any, any>>> |

#### Parameters:

Name | Type |
------ | ------ |
`effects` | A |

**Returns:** [ZipObjEffect](_effect_zipobj_.md#zipobjeffect)\<A>
