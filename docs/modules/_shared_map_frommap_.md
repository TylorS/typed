**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/fromMap"

# Module: "Shared/map/fromMap"

## Index

### Functions

* [fromMap](_shared_map_frommap_.md#frommap)

## Functions

### fromMap

▸ `Const`**fromMap**\<K, V>(`key?`: Eq\<K>, `value?`: Eq\<V>): (Anonymous function)

*Defined in [src/Shared/map/fromMap.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/map/fromMap.ts#L12)*

Constructor a SharedMap that requires being provided by the environment.

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
