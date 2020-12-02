**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["node/HistoryEnv/ServerHistory"](../modules/_node_historyenv_serverhistory_.md) / ServerHistory

# Class: ServerHistory

An implementation of the `History` interface in-memory.

## Hierarchy

* **ServerHistory**

## Implements

* History

## Index

### Constructors

* [constructor](_node_historyenv_serverhistory_.serverhistory.md#constructor)

### Properties

* [\_index](_node_historyenv_serverhistory_.serverhistory.md#_index)
* [\_states](_node_historyenv_serverhistory_.serverhistory.md#_states)
* [location](_node_historyenv_serverhistory_.serverhistory.md#location)
* [scrollRestoration](_node_historyenv_serverhistory_.serverhistory.md#scrollrestoration)

### Accessors

* [index](_node_historyenv_serverhistory_.serverhistory.md#index)
* [length](_node_historyenv_serverhistory_.serverhistory.md#length)
* [state](_node_historyenv_serverhistory_.serverhistory.md#state)

### Methods

* [back](_node_historyenv_serverhistory_.serverhistory.md#back)
* [forward](_node_historyenv_serverhistory_.serverhistory.md#forward)
* [go](_node_historyenv_serverhistory_.serverhistory.md#go)
* [pushState](_node_historyenv_serverhistory_.serverhistory.md#pushstate)
* [replaceState](_node_historyenv_serverhistory_.serverhistory.md#replacestate)

## Constructors

### constructor

\+ **new ServerHistory**(`location`: Location): [ServerHistory](_node_historyenv_serverhistory_.serverhistory.md)

*Defined in [src/node/HistoryEnv/ServerHistory.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`location` | Location |

**Returns:** [ServerHistory](_node_historyenv_serverhistory_.serverhistory.md)

## Properties

### \_index

• `Private` **\_index**: number = 0

*Defined in [src/node/HistoryEnv/ServerHistory.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L10)*

___

### \_states

• `Private` **\_states**: { state: unknown ; url: string  }[]

*Defined in [src/node/HistoryEnv/ServerHistory.ts:9](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L9)*

___

### location

• `Private` **location**: Location

*Defined in [src/node/HistoryEnv/ServerHistory.ts:11](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L11)*

___

### scrollRestoration

•  **scrollRestoration**: ScrollRestoration = "auto"

*Defined in [src/node/HistoryEnv/ServerHistory.ts:6](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L6)*

## Accessors

### index

• `Private`get **index**(): number

*Defined in [src/node/HistoryEnv/ServerHistory.ts:26](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L26)*

**Returns:** number

• `Private`set **index**(`value`: number): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:18](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | number |

**Returns:** void

___

### length

• get **length**(): number

*Defined in [src/node/HistoryEnv/ServerHistory.ts:30](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L30)*

**Returns:** number

___

### state

• get **state**(): any

*Defined in [src/node/HistoryEnv/ServerHistory.ts:34](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L34)*

**Returns:** any

## Methods

### back

▸ **back**(): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:51](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L51)*

**Returns:** void

___

### forward

▸ **forward**(): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:55](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L55)*

**Returns:** void

___

### go

▸ **go**(`quanity?`: number): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:40](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L40)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`quanity` | number | 0 |

**Returns:** void

___

### pushState

▸ **pushState**(`state`: unknown, `_`: string \| null, `url`: string): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:59](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L59)*

#### Parameters:

Name | Type |
------ | ------ |
`state` | unknown |
`_` | string \| null |
`url` | string |

**Returns:** void

___

### replaceState

▸ **replaceState**(`state`: unknown, `_`: string \| null, `url`: string): void

*Defined in [src/node/HistoryEnv/ServerHistory.ts:64](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerHistory.ts#L64)*

#### Parameters:

Name | Type |
------ | ------ |
`state` | unknown |
`_` | string \| null |
`url` | string |

**Returns:** void
