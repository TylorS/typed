**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/ap"

# Module: "Effect/ap"

## Index

### Variables

* [ap](_effect_ap_.md#ap)
* [apSeq](_effect_ap_.md#apseq)

## Variables

### ap

• `Const` **ap**: \<E1, A, B, E2>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>, value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B>\<E1, A, B>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>) => \<E2>(value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B> = curry( \<E1, A, B, E2>(fn: Effect\<E1, Arity1\<A, B>>, value: Effect\<E2, A>): Effect\<E1 & E2, B> => { const fnEnv = toEnv(fn) const valueEnv = toEnv(value) return fromEnv((e: E1 & E2) => apResume(fnEnv(e), valueEnv(e))) },) as { \<E1, A, B, E2>(fn: Effect\<E1, Arity1\<A, B>>, value: Effect\<E2, A>): Effect\<E1 & E2, B> \<E1, A, B>(fn: Effect\<E1, Arity1\<A, B>>): \<E2>(value: Effect\<E2, A>) => Effect\<E1 & E2, B>}

*Defined in [src/Effect/ap.ts:13](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ap.ts#L13)*

Apply an Effect of a function to the Effect of a value running those Effects in parallel.

___

### apSeq

• `Const` **apSeq**: \<E1, A, B, E2>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>, value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B>\<E1, A, B>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>) => \<E2>(value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B> = curry( \<E1, A, B, E2>(fn: Effect\<E1, Arity1\<A, B>>, value: Effect\<E2, A>): Effect\<E1 & E2, B> => chain((f) => map(f, value), fn),) as { \<E1, A, B, E2>(fn: Effect\<E1, Arity1\<A, B>>, value: Effect\<E2, A>): Effect\<E1 & E2, B> \<E1, A, B>(fn: Effect\<E1, Arity1\<A, B>>): \<E2>(value: Effect\<E2, A>) => Effect\<E1 & E2, B>}

*Defined in [src/Effect/ap.ts:28](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/ap.ts#L28)*

Apply an Effect of a function to the Effect of a value running those Effects in sequence.
