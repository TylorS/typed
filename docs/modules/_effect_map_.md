**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/map"

# Module: "Effect/map"

## Index

### Variables

* [map](_effect_map_.md#map)

## Variables

### map

• `Const` **map**: \<A, B, E>(f: [Arity1](_common_types_.md#arity1)\<A, B>, eff: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<E, B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, B>) => \<E>(eff: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<E, B> = curry( \<A, B, E>(f: Arity1\<A, B>, eff: Effect\<E, A>): Effect\<E, B> => doEffect(function* () { return f(yield* eff) }),) as { \<A, B, E>(f: Arity1\<A, B>, eff: Effect\<E, A>): Effect\<E, B> \<A, B>(f: Arity1\<A, B>): \<E>(eff: Effect\<E, A>) => Effect\<E, B>}

*Defined in [src/Effect/map.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/Effect/map.ts#L10)*

Apply a function to the return value of an Effect.
