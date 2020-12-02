**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/toReaderTask"

# Module: "Effect/toReaderTask"

## Index

### Functions

* [toReaderTask](_effect_toreadertask_.md#toreadertask)

## Functions

### toReaderTask

▸ `Const`**toReaderTask**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>): ReaderTask\<E, A>

*Defined in [src/Effect/toReaderTask.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/toReaderTask.ts#L11)*

Converts an Effect<E, A> into a ReaderTask<E, A>

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |

**Returns:** ReaderTask\<E, A>
