**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/toEnv"

# Module: "Effect/toEnv"

## Index

### Functions

* [effectGeneratorToResume](_effect_toenv_.md#effectgeneratortoresume)
* [toEnv](_effect_toenv_.md#toenv)

## Functions

### effectGeneratorToResume

▸ `Const`**effectGeneratorToResume**\<E, A>(`generator`: [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A>, `result`: IteratorResult\<[Env](_effect_effect_.md#env)\<E, unknown>, A>, `env`: E): [Resume](_resume_resume_.md#resume)\<A>

*Defined in [src/Effect/toEnv.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Effect/toEnv.ts#L14)*

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`generator` | [EffectGenerator](_effect_effect_.md#effectgenerator)\<E, A> |
`result` | IteratorResult\<[Env](_effect_effect_.md#env)\<E, unknown>, A> |
`env` | E |

**Returns:** [Resume](_resume_resume_.md#resume)\<A>

___

### toEnv

▸ `Const`**toEnv**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>): [Env](_effect_effect_.md#env)\<E, A>

*Defined in [src/Effect/toEnv.ts:8](https://github.com/TylorS/typed-fp/blob/41076ce/src/Effect/toEnv.ts#L8)*

Converts an Effect<A, A> to and Env<E, A> with a simple stack-safe interpreter.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** [Env](_effect_effect_.md#env)\<E, A>
