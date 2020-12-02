**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/lazy"

# Module: "Effect/lazy"

## Index

### Functions

* [lazy](_effect_lazy_.md#lazy)

## Functions

### lazy

▸ `Const`**lazy**\<E, A>(`io`: IO\<[Effect](_effect_effect_.effect.md)\<E, A>>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Effect/lazy.ts:9](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/lazy.ts#L9)*

Create an Effect<E, A> from an IO<Effect<E, A>>

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`io` | IO\<[Effect](_effect_effect_.effect.md)\<E, A>> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>
