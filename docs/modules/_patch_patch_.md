**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/Patch"

# Module: "Patch/Patch"

## Index

### Interfaces

* [Patch](../interfaces/_patch_patch_.patch.md)

### Functions

* [patch](_patch_patch_.md#patch)

## Functions

### patch

▸ `Const`**patch**\<A, B>(`a`: A, `b`: B): [Effect](_effect_effect_.effect.md)\<[Patch](../interfaces/_patch_patch_.patch.md)\<A, B>, A>

*Defined in [src/Patch/Patch.ts:15](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Patch/Patch.ts#L15)*

Patch a previous value with a current, generally used for Rendering.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`a` | A |
`b` | B |

**Returns:** [Effect](_effect_effect_.effect.md)\<[Patch](../interfaces/_patch_patch_.patch.md)\<A, B>, A>
