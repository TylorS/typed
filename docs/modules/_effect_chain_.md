**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/chain"

# Module: "Effect/chain"

## Index

### Variables

* [chain](_effect_chain_.md#chain)

## Variables

### chain

• `Const` **chain**: \<A, E1, B, E2>(f: [Arity1](_common_types_.md#arity1)\<A, [Effect](_effect_effect_.effect.md)\<E1, B>>, eff: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E2 & E1, B>\<A, E1, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Effect](_effect_effect_.effect.md)\<E1, B>>) => \<E2>(eff: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E2 & E1, B> = curry( \<A, E1, B, E2>(f: Arity1\<A, Effect\<E1, B>>, eff: Effect\<E2, A>): Effect\<E1 & E2, B> => doEffect(function* () { return yield* f(yield* eff) }) as Effect\<E1 & E2, B>,) as { \<A, E1, B, E2>(f: Arity1\<A, Effect\<E1, B>>, eff: Effect\<E2, A>): Effect\<E2 & E1, B> \<A, E1, B>(f: Arity1\<A, Effect\<E1, B>>): \<E2>(eff: Effect\<E2, A>) => Effect\<E2 & E1, B>}

*Defined in [src/Effect/chain.ts:10](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Effect/chain.ts#L10)*

Sequence together 2 Effects.
