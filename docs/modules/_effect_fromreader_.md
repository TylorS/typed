**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/fromReader"

# Module: "Effect/fromReader"

## Index

### Functions

* [fromReader](_effect_fromreader_.md#fromreader)

## Functions

### fromReader

▸ **fromReader**\<E, A>(`reader`: Reader\<E, A>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Effect/fromReader.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/fromReader.ts#L10)*

Convert a Reader<E, A> into an Effect<E, A>

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`reader` | Reader\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>
