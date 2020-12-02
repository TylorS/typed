**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/map/SharedMap"

# Module: "Shared/map/SharedMap"

## Index

### Interfaces

* [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md)

### Type aliases

* [SharedMapKey](_shared_map_sharedmap_.md#sharedmapkey)
* [SharedMapValue](_shared_map_sharedmap_.md#sharedmapvalue)

## Type aliases

### SharedMapKey

Ƭ  **SharedMapKey**\<A>: GetSharedValue\<A> *extends* ReadonlyMap\<*infer* K, any> ? K : never

*Defined in [src/Shared/map/SharedMap.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/map/SharedMap.ts#L12)*

Extract the keys of a SharedMap

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md) |

___

### SharedMapValue

Ƭ  **SharedMapValue**\<A>: GetSharedValue\<A> *extends* ReadonlyMap\<any, *infer* V> ? V : never

*Defined in [src/Shared/map/SharedMap.ts:19](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/map/SharedMap.ts#L19)*

Extract the values of a SharedMap

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [SharedMap](../interfaces/_shared_map_sharedmap_.sharedmap.md) |
