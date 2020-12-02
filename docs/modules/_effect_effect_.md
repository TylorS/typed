**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/Effect"

# Module: "Effect/Effect"

## Index

### Namespaces

* [Effect](_effect_effect_.effect.md)

### Type aliases

* [AddEnv](_effect_effect_.md#addenv)
* [EffectGenerator](_effect_effect_.md#effectgenerator)
* [EffectOf](_effect_effect_.md#effectof)
* [Env](_effect_effect_.md#env)
* [EnvOf](_effect_effect_.md#envof)
* [Envs](_effect_effect_.md#envs)
* [IsEffect](_effect_effect_.md#iseffect)
* [Pure](_effect_effect_.md#pure)
* [ReturnOf](_effect_effect_.md#returnof)
* [ReturnTypeOf](_effect_effect_.md#returntypeof)

### Variables

* [Pure](_effect_effect_.md#pure)

### Functions

* [fromEnv](_effect_effect_.md#fromenv)

## Type aliases

### AddEnv

Ƭ  **AddEnv**\<E, Fx>: [Effect](_effect_effect_.effect.md)\<E & [EnvOf](_effect_effect_.md#envof)\<Fx>, [ReturnOf](_effect_effect_.md#returnof)\<Fx>>

*Defined in [src/Effect/Effect.ts:96](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L96)*

Helper for widening the effect type of a given effect

#### Type parameters:

Name |
------ |
`E` |
`Fx` |

___

### EffectGenerator

Ƭ  **EffectGenerator**\<E, A>: Generator\<[Env](_effect_effect_.md#env)\<E, any>, A, unknown>

*Defined in [src/Effect/Effect.ts:39](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L39)*

The underlying generator that allows modeling lightweight coroutines

#### Type parameters:

Name |
------ |
`E` |
`A` |

___

### EffectOf

Ƭ  **EffectOf**\<A>: A *extends* Effect\<*infer* E, *infer* B> ? Effect\<E, B> : IsNever\<ReturnTypeOf\<A>> *extends* true ? never : ReturnTypeOf\<A> *extends* Effect\<*infer* E, *infer* B> ? Effect\<E, B> : never

*Defined in [src/Effect/Effect.ts:59](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L59)*

Helper for retrieving the effect with widened environment type

#### Type parameters:

Name |
------ |
`A` |

___

### Env

Ƭ  **Env**\<E, A>: Reader\<E, [Resume](_resume_resume_.md#resume)\<A>>

*Defined in [src/Effect/Effect.ts:44](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L44)*

A monadic environment type which can be yielded within an Effect

#### Type parameters:

Name |
------ |
`E` |
`A` |

___

### EnvOf

Ƭ  **EnvOf**\<A>: EffectOf\<A> *extends* Effect\<*infer* R, any> ? R : never

*Defined in [src/Effect/Effect.ts:86](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L86)*

Helper for retrieving the environmental dependencies from an effect

#### Type parameters:

Name |
------ |
`A` |

___

### Envs

Ƭ  **Envs**\<A>: [And](_common_and_.md#and)\<{}>

*Defined in [src/Effect/Effect.ts:70](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L70)*

Helper for creating an intersection of environments

#### Type parameters:

Name | Type |
------ | ------ |
`A` | ReadonlyArray\<unknown> |

___

### IsEffect

Ƭ  **IsEffect**\<A>: [Equals](_common_types_.md#equals)\<A, [Effect](_effect_effect_.effect.md)\<any, any>>

*Defined in [src/Effect/Effect.ts:80](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L80)*

#### Type parameters:

Name |
------ |
`A` |

___

### Pure

Ƭ  **Pure**\<A>: [Effect](_effect_effect_.effect.md)\<unknown, A>

*Defined in [src/Effect/Effect.ts:33](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L33)*

An Effect which has no particular requirement on the environment. It has
been chosen to represent the "empty environment" using `unknown` because
A & unknown == A. However, it is often possible to get into an edge case
where you can pass an Effect<E, A> to a function expecting a Pure<A>
and not get a type-error.

#### Type parameters:

Name |
------ |
`A` |

___

### ReturnOf

Ƭ  **ReturnOf**\<A>: EffectOf\<A> *extends* Effect\<any, *infer* R> ? R : never

*Defined in [src/Effect/Effect.ts:91](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L91)*

Helper for getting the return type from a given effect type

#### Type parameters:

Name |
------ |
`A` |

___

### ReturnTypeOf

Ƭ  **ReturnTypeOf**\<A>: [A] *extends* [(...args: any) => any] ? ReturnType\<A> : never

*Defined in [src/Effect/Effect.ts:81](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L81)*

#### Type parameters:

Name |
------ |
`A` |

## Variables

### Pure

• `Const` **Pure**: [Effect](_effect_effect_.effect.md) = Effect

*Defined in [src/Effect/Effect.ts:34](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L34)*

## Functions

### fromEnv

▸ **fromEnv**\<E, A>(`env`: [Env](_effect_effect_.md#env)\<E, A>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Effect/Effect.ts:46](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/Effect.ts#L46)*

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`env` | [Env](_effect_effect_.md#env)\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>
