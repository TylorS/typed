**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/fromTask"

# Module: "Effect/fromTask"

## Index

### Functions

* [fromTask](_effect_fromtask_.md#fromtask)

## Functions

### fromTask

▸ **fromTask**\<A>(`task`: Task\<A>): [Pure](_effect_effect_.md#pure)\<A>

*Defined in [src/Effect/fromTask.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/Effect/fromTask.ts#L14)*

Converts a Task into an Effect. Does not handle errors from your promise, if this is required
try using Either or another more expressive type.

**`example`** 
fromTask(() => import('@typed/fp'))

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`task` | Task\<A> |

**Returns:** [Pure](_effect_effect_.md#pure)\<A>
