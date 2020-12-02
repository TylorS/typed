**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/doEffect"

# Module: "Effect/doEffect"

## Index

### Functions

* [doEffect](_effect_doeffect_.md#doeffect)

## Functions

### doEffect

▸ **doEffect**\<G>(`effectGeneratorFunction`: G): [EffectOf](_effect_effect_.md#effectof)\<G>

*Defined in [src/Effect/doEffect.ts:6](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/doEffect.ts#L6)*

Convert a Generator Function into an Effect

#### Type parameters:

Name | Type |
------ | ------ |
`G` | () => [EffectGenerator](_effect_effect_.md#effectgenerator)\<any, any> |

#### Parameters:

Name | Type |
------ | ------ |
`effectGeneratorFunction` | G |

**Returns:** [EffectOf](_effect_effect_.md#effectof)\<G>
