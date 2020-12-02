**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/fromReaderTask"

# Module: "Effect/fromReaderTask"

## Index

### Functions

* [fromReaderTask](_effect_fromreadertask_.md#fromreadertask)

## Functions

### fromReaderTask

▸ **fromReaderTask**\<E, A>(`rte`: ReaderTask\<E, A>): [Effect](_effect_effect_.effect.md)\<E, A>

*Defined in [src/Effect/fromReaderTask.ts:12](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/fromReaderTask.ts#L12)*

Convert a ReaderTask<E, A> into an Effect<E, A>

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`rte` | ReaderTask\<E, A> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E, A>
