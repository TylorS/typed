**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/provideWith"

# Module: "Effect/provideWith"

## Index

### Functions

* [provideWith](_effect_providewith_.md#providewith)
* [useWith](_effect_providewith_.md#usewith)

## Functions

### provideWith

▸ **provideWith**\<E1, E2>(`provider`: [Effect](_effect_effect_.effect.md)\<E1, E2>): (Anonymous function)

*Defined in [src/Effect/provideWith.ts:10](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/provideWith.ts#L10)*

Use an Effect to compute part of the environment for another Effect using provideSome.

#### Type parameters:

Name |
------ |
`E1` |
`E2` |

#### Parameters:

Name | Type |
------ | ------ |
`provider` | [Effect](_effect_effect_.effect.md)\<E1, E2> |

**Returns:** (Anonymous function)

___

### useWith

▸ **useWith**\<E1, E2>(`provider`: [Effect](_effect_effect_.effect.md)\<E1, E2>): (Anonymous function)

*Defined in [src/Effect/provideWith.ts:20](https://github.com/TylorS/typed-fp/blob/f129829/src/Effect/provideWith.ts#L20)*

Use an Effect to computer part of the environment for another Effect using useSome.

#### Type parameters:

Name |
------ |
`E1` |
`E2` |

#### Parameters:

Name | Type |
------ | ------ |
`provider` | [Effect](_effect_effect_.effect.md)\<E1, E2> |

**Returns:** (Anonymous function)
