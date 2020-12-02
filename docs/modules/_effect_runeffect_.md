**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/runEffect"

# Module: "Effect/runEffect"

## Index

### Variables

* [execEffect](_effect_runeffect_.md#execeffect)
* [execPure](_effect_runeffect_.md#execpure)
* [runEffect](_effect_runeffect_.md#runeffect)
* [runPure](_effect_runeffect_.md#runpure)

### Functions

* [\_\_runEffect](_effect_runeffect_.md#__runeffect)
* [\_\_runPure](_effect_runeffect_.md#__runpure)

## Variables

### execEffect

• `Const` **execEffect**: \<E>(env: [NoInfer](_common_types_.md#noinfer)\<E>, effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable\<E>(env: E) => (effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable = runEffect\<unknown>(disposeNone)

*Defined in [src/Effect/runEffect.ts:38](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L38)*

Execute an Effect without care for the return value.

___

### execPure

• `Const` **execPure**: (effect: [Pure](_effect_effect_.md#pure)\<A>) => Disposable = runPure(disposeNone)

*Defined in [src/Effect/runEffect.ts:24](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L24)*

Pure will unfortunately swallow environment requirements, so be sure
to use in conjunction with useAll/provideAll.

___

### runEffect

• `Const` **runEffect**: \<A, E>(onReturn: [Arity1](_common_types_.md#arity1)\<A, Disposable>, env: [NoInfer](_common_types_.md#noinfer)\<E>, effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable\<A, E>(onReturn: [Arity1](_common_types_.md#arity1)\<A, Disposable>, env: E) => (effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable\<A>(onReturn: [Arity1](_common_types_.md#arity1)\<A, Disposable>) => \<E>(env: [NoInfer](_common_types_.md#noinfer)\<E>, effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable\<E>(env: E) => (effect: [Effect](_effect_effect_.effect.md)\<E, A>) => Disposable = curry(\_\_runEffect) as { \<A, E>(onReturn: Arity1\<A, Disposable>, env: NoInfer\<E>, effect: Effect\<E, A>): Disposable \<A, E>(onReturn: Arity1\<A, Disposable>, env: E): (effect: Effect\<E, A>) => Disposable \<A>(onReturn: Arity1\<A, Disposable>): { \<E>(env: NoInfer\<E>, effect: Effect\<E, A>): Disposable \<E>(env: E): (effect: Effect\<E, A>) => Disposable }}

*Defined in [src/Effect/runEffect.ts:26](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L26)*

___

### runPure

• `Const` **runPure**: \<A>(onReturn: [Arity1](_common_types_.md#arity1)\<A, Disposable>, effect: [Pure](_effect_effect_.md#pure)\<A>) => Disposable\<A>(onReturn: [Arity1](_common_types_.md#arity1)\<A, Disposable>) => (effect: [Pure](_effect_effect_.md#pure)\<A>) => Disposable = curry(\_\_runPure) as { \<A>(onReturn: Arity1\<A, Disposable>, effect: Pure\<A>): Disposable \<A>(onReturn: Arity1\<A, Disposable>): (effect: Pure\<A>) => Disposable}

*Defined in [src/Effect/runEffect.ts:15](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L15)*

Pure will unfortunately swallow environment requirements, so be sure
to use in conjunction with useAll/provideAll.

## Functions

### \_\_runEffect

▸ **__runEffect**\<A, E>(`onReturn`: [Arity1](_common_types_.md#arity1)\<A, Disposable>, `env`: E, `effect`: [Effect](_effect_effect_.effect.md)\<E, A>): Disposable

*Defined in [src/Effect/runEffect.ts:40](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L40)*

#### Type parameters:

Name |
------ |
`A` |
`E` |

#### Parameters:

Name | Type |
------ | ------ |
`onReturn` | [Arity1](_common_types_.md#arity1)\<A, Disposable> |
`env` | E |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** Disposable

___

### \_\_runPure

▸ **__runPure**\<A>(`onReturn`: [Arity1](_common_types_.md#arity1)\<A, Disposable>, `effect`: [Pure](_effect_effect_.md#pure)\<A>): Disposable

*Defined in [src/Effect/runEffect.ts:48](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/runEffect.ts#L48)*

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`onReturn` | [Arity1](_common_types_.md#arity1)\<A, Disposable> |
`effect` | [Pure](_effect_effect_.md#pure)\<A> |

**Returns:** Disposable
