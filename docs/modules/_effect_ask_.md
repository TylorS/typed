**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/ask"

# Module: "Effect/ask"

## Index

### Functions

* [ask](_effect_ask_.md#ask)
* [askFor](_effect_ask_.md#askfor)
* [asks](_effect_ask_.md#asks)
* [doEffectWith](_effect_ask_.md#doeffectwith)

## Functions

### ask

▸ `Const`**ask**\<E>(): [Effect](_effect_effect_.effect.md)\<E, E>

*Defined in [src/Effect/ask.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ask.ts#L12)*

Ask for a value from the Environment

#### Type parameters:

Name | Default |
------ | ------ |
`E` | unknown |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, E>

___

### askFor

▸ `Const`**askFor**\<E, A>(`eff`: [Effect](_effect_effect_.effect.md)\<E, A>): [Effect](_effect_effect_.effect.md)\<E, [Pure](_effect_effect_.md#pure)\<A>>

*Defined in [src/Effect/ask.ts:22](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ask.ts#L22)*

Ask for the Pure version of an Effect.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`eff` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, [Pure](_effect_effect_.md#pure)\<A>>

___

### asks

▸ `Const`**asks**\<E, A>(`f`: [Arity1](_common_types_.md#arity1)\<E, A>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Effect/ask.ts:17](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ask.ts#L17)*

Apply a function to the Environment.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`f` | [Arity1](_common_types_.md#arity1)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>

___

### doEffectWith

▸ `Const`**doEffectWith**\<G>(`effectGeneratorFunction`: G): [AddEnv](_effect_effect_.md#addenv)\<[HeadArg](_common_types_.md#headarg)\<G>, [EffectOf](_effect_effect_.md#effectof)\<G>>

*Defined in [src/Effect/ask.ts:33](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ask.ts#L33)*

Create an Effect with part of the environment being provided to the provided generator function.

#### Type parameters:

Name | Type |
------ | ------ |
`G` | (env: unknown) => [EffectGenerator](_effect_effect_.md#effectgenerator)\<any, any> |

#### Parameters:

Name | Type |
------ | ------ |
`effectGeneratorFunction` | G |

**Returns:** [AddEnv](_effect_effect_.md#addenv)\<[HeadArg](_common_types_.md#headarg)\<G>, [EffectOf](_effect_effect_.md#effectof)\<G>>
