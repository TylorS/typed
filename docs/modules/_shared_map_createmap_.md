**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/createMap"

# Module: "Shared/map/createMap"

## Index

### Functions

* [createMap](_shared_map_createmap_.md#createmap)

## Functions

### createMap

▸ `Const`**createMap**\<K, V>(`key?`: Eq\<K>, `value?`: Eq\<V>): (Anonymous function)

*Defined in [src/Shared/map/createMap.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/map/createMap.ts#L11)*

Helper for constructing a SharedMap with a handful of core operators.

#### Type parameters:

Name |
------ |
`K` |
`V` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`key` | Eq\<K> | deepEqualsEq |
`value` | Eq\<V> | deepEqualsEq |

**Returns:** (Anonymous function)
