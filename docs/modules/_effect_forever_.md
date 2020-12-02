**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/forever"

# Module: "Effect/forever"

## Index

### Functions

* [forever](_effect_forever_.md#forever)

## Functions

### forever

▸ `Const`**forever**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>, `onValue?`: undefined \| (value: A) => void): [Effect](_effect_effect_.effect.md)\<E, never>

*Defined in [src/Effect/forever.ts:7](https://github.com/TylorS/typed-fp/blob/8639976/src/Effect/forever.ts#L7)*

Run an Effect over and over within a while-loop.

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |
`onValue?` | undefined \| (value: A) => void |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, never>
