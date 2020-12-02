**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/provide"

# Module: "Effect/provide"

## Index

### Type aliases

* [ProvidedAdditional](_effect_provide_.md#providedadditional)
* [ProvidedEnvs](_effect_provide_.md#providedenvs)
* [Provider](_effect_provide_.md#provider)

### Variables

* [provideAll](_effect_provide_.md#provideall)
* [provideSome](_effect_provide_.md#providesome)
* [useAll](_effect_provide_.md#useall)
* [useSome](_effect_provide_.md#usesome)

### Functions

* [provideMany](_effect_provide_.md#providemany)

## Type aliases

### ProvidedAdditional

Ƭ  **ProvidedAdditional**\<Providers>: [And](_common_and_.md#and)\<{}>

*Defined in [src/Effect/provide.ts:66](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L66)*

#### Type parameters:

Name | Type |
------ | ------ |
`Providers` | ReadonlyArray\<[Provider](_effect_provide_.md#provider)\<any, any>> |

___

### ProvidedEnvs

Ƭ  **ProvidedEnvs**\<Providers>: [And](_common_and_.md#and)\<{}>

*Defined in [src/Effect/provide.ts:60](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L60)*

#### Type parameters:

Name | Type |
------ | ------ |
`Providers` | ReadonlyArray\<[Provider](_effect_provide_.md#provider)\<any, any>> |

___

### Provider

Ƭ  **Provider**\<Provided, Additional>: \<E, A>(effect: [Effect](_effect_effect_.effect.md)\<E & Provided, A>) => [Effect](_effect_effect_.effect.md)\<E & Additional, A>

*Defined in [src/Effect/provide.ts:11](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L11)*

A type representing functions which provide (or add) requirements
to an Effect's environment.

#### Type parameters:

Name | Default |
------ | ------ |
`Provided` | - |
`Additional` | unknown |

## Variables

### provideAll

• `Const` **provideAll**: \<E, A>(e: E, fx: [Effect](_effect_effect_.effect.md)\<E, A>) => [Pure](_effect_effect_.md#pure)\<A>\<E>(e: E) => \<A>(fx: [Effect](_effect_effect_.effect.md)\<E, A>) => [Pure](_effect_effect_.md#pure)\<A> = curry( \<E, A>(e: E, fx: Effect\<E, A>): Pure\<A> => fromEnv((u: unknown) => toEnv(fx)({ ...e, ...(u as object) })),) as { \<E, A>(e: E, fx: Effect\<E, A>): Pure\<A> \<E>(e: E): \<A>(fx: Effect\<E, A>) => Pure\<A>}

*Defined in [src/Effect/provide.ts:52](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L52)*

Provide part of the environemnt, allowing for replacement later on.

___

### provideSome

• `Const` **provideSome**: \<E1, A>(e1: E1, fx: [Effect](_effect_effect_.effect.md)\<E1, A>) => [Pure](_effect_effect_.md#pure)\<A>\<E1, E2, A>(e1: E1, fx: [Effect](_effect_effect_.effect.md)\<E1 & E2, A>) => [Effect](_effect_effect_.effect.md)\<E2, A>\<E1>(e1: E1) => [Provider](_effect_provide_.md#provider)\<E1> = curry( \<E1, E2, A>(e1: E1, fx: Effect\<E1 & E2, A>): Effect\<E2, A> => fromEnv((e2: E2) => toEnv(fx)({ ...e1, ...e2 })),) as { \<E1, A>(e1: E1, fx: Effect\<E1, A>): Pure\<A> \<E1, E2, A>(e1: E1, fx: Effect\<E1 & E2, A>): Effect\<E2, A> \<E1>(e1: E1): Provider\<E1>}

*Defined in [src/Effect/provide.ts:30](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L30)*

Provide part of the environemnt, allowing for replacement later on.

___

### useAll

• `Const` **useAll**: \<E, A>(e1: E, fx: [Effect](_effect_effect_.effect.md)\<E, A>) => [Pure](_effect_effect_.md#pure)\<A>\<E>(e1: E) => \<A>(fx: [Effect](_effect_effect_.effect.md)\<E, A>) => [Pure](_effect_effect_.md#pure)\<A> = curry(\<E, A>(e1: E, fx: Effect\<E, A>) => fromEnv((e2) => toEnv(fx)({ ...(e2 as object), ...e1 })),) as { \<E, A>(e1: E, fx: Effect\<E, A>): Pure\<A> \<E>(e1: E): \<A>(fx: Effect\<E, A>) => Pure\<A>}

*Defined in [src/Effect/provide.ts:42](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L42)*

Provide part of the environemnt, enforcing its usage.

___

### useSome

• `Const` **useSome**: \<E1, A>(e1: E1, fx: [Effect](_effect_effect_.effect.md)\<E1, A>) => [Pure](_effect_effect_.md#pure)\<A>\<E1, E2, A>(e1: E1, fx: [Effect](_effect_effect_.effect.md)\<E1 & E2, A>) => [Effect](_effect_effect_.effect.md)\<E2, A>\<E1>(e1: E1) => [Provider](_effect_provide_.md#provider)\<E1> = curry( \<E1, E2, A>(e1: E1, fx: Effect\<E1 & E2, A>): Effect\<E2, A> => fromEnv((e2: E2) => toEnv(fx)({ ...e2, ...e1 })),) as { \<E1, A>(e1: E1, fx: Effect\<E1, A>): Pure\<A> \<E1, E2, A>(e1: E1, fx: Effect\<E1 & E2, A>): Effect\<E2, A> \<E1>(e1: E1): Provider\<E1>}

*Defined in [src/Effect/provide.ts:18](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L18)*

Provide part of the environemnt, enforcing its usage.

## Functions

### provideMany

▸ `Const`**provideMany**\<Providers>(...`__namedParameters`: [\<E, A>(effect: [Effect](_effect_effect_.effect.md)\<E & Provided, A>) => [Effect](_effect_effect_.effect.md)\<E & Additional, A>, Array]): [Provider](_effect_provide_.md#provider)\<[ProvidedEnvs](_effect_provide_.md#providedenvs)\<Providers>, [ProvidedAdditional](_effect_provide_.md#providedadditional)\<Providers>>

*Defined in [src/Effect/provide.ts:75](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/provide.ts#L75)*

A helper fro composing many Provider functions together to create a singular Provider function.

#### Type parameters:

Name | Type |
------ | ------ |
`Providers` | readonly [[Provider](_effect_provide_.md#provider)\<any, any>, ReadonlyArray] |

#### Parameters:

Name | Type |
------ | ------ |
`...__namedParameters` | [\<E, A>(effect: [Effect](_effect_effect_.effect.md)\<E & Provided, A>) => [Effect](_effect_effect_.effect.md)\<E & Additional, A>, Array] |

**Returns:** [Provider](_effect_provide_.md#provider)\<[ProvidedEnvs](_effect_provide_.md#providedenvs)\<Providers>, [ProvidedAdditional](_effect_provide_.md#providedadditional)\<Providers>>
