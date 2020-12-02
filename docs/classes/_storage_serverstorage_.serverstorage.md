**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Storage/serverStorage"](../modules/_storage_serverstorage_.md) / ServerStorage

# Class: ServerStorage

## Hierarchy

* **ServerStorage**

## Implements

* Storage

## Index

### Constructors

* [constructor](_storage_serverstorage_.serverstorage.md#constructor)

### Properties

* [map](_storage_serverstorage_.serverstorage.md#map)

### Accessors

* [length](_storage_serverstorage_.serverstorage.md#length)

### Methods

* [clear](_storage_serverstorage_.serverstorage.md#clear)
* [getItem](_storage_serverstorage_.serverstorage.md#getitem)
* [key](_storage_serverstorage_.serverstorage.md#key)
* [removeItem](_storage_serverstorage_.serverstorage.md#removeitem)
* [setItem](_storage_serverstorage_.serverstorage.md#setitem)

## Constructors

### constructor

\+ **new ServerStorage**(`map?`: [Map](../enums/_logic_json_.tag.md#map)\<string, string>): [ServerStorage](_storage_serverstorage_.serverstorage.md)

*Defined in [src/Storage/serverStorage.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`map?` | [Map](../enums/_logic_json_.tag.md#map)\<string, string> |

**Returns:** [ServerStorage](_storage_serverstorage_.serverstorage.md)

## Properties

### map

•  **map**: [Map](../interfaces/_shared_core_model_sharedkeystore_.sharedkeystore.md#map)\<string, string>

*Defined in [src/Storage/serverStorage.ts:13](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L13)*

## Accessors

### length

• get **length**(): number

*Defined in [src/Storage/serverStorage.ts:19](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L19)*

**Returns:** number

## Methods

### clear

▸ **clear**(): void

*Defined in [src/Storage/serverStorage.ts:23](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L23)*

**Returns:** void

___

### getItem

▸ **getItem**(`key`: string): string \| null

*Defined in [src/Storage/serverStorage.ts:31](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L31)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** string \| null

___

### key

▸ **key**(`index`: number): string \| null

*Defined in [src/Storage/serverStorage.ts:35](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L35)*

#### Parameters:

Name | Type |
------ | ------ |
`index` | number |

**Returns:** string \| null

___

### removeItem

▸ **removeItem**(`key`: string): void

*Defined in [src/Storage/serverStorage.ts:41](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L41)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |

**Returns:** void

___

### setItem

▸ **setItem**(`key`: string, `value`: string): void

*Defined in [src/Storage/serverStorage.ts:27](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Storage/serverStorage.ts#L27)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | string |
`value` | string |

**Returns:** void
