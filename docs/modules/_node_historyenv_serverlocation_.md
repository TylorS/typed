**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "node/HistoryEnv/ServerLocation"

# Module: "node/HistoryEnv/ServerLocation"

## Index

### Classes

* [ServerLocation](../classes/_node_historyenv_serverlocation_.serverlocation.md)

### Variables

* [HTTPS\_DEFAULT\_PORT](_node_historyenv_serverlocation_.md#https_default_port)
* [HTTPS\_PROTOCOL](_node_historyenv_serverlocation_.md#https_protocol)
* [HTTP\_DEFAULT\_PORT](_node_historyenv_serverlocation_.md#http_default_port)

### Functions

* [parseValue](_node_historyenv_serverlocation_.md#parsevalue)
* [replace](_node_historyenv_serverlocation_.md#replace)

## Variables

### HTTPS\_DEFAULT\_PORT

• `Const` **HTTPS\_DEFAULT\_PORT**: \"443\" = "443"

*Defined in [src/node/HistoryEnv/ServerLocation.ts:4](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerLocation.ts#L4)*

___

### HTTPS\_PROTOCOL

• `Const` **HTTPS\_PROTOCOL**: \"https:\" = "https:"

*Defined in [src/node/HistoryEnv/ServerLocation.ts:3](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerLocation.ts#L3)*

___

### HTTP\_DEFAULT\_PORT

• `Const` **HTTP\_DEFAULT\_PORT**: \"80\" = "80"

*Defined in [src/node/HistoryEnv/ServerLocation.ts:5](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerLocation.ts#L5)*

## Functions

### parseValue

▸ **parseValue**(`key`: keyof [ParsedUri](_uri_exports_.md#parseduri), `location`: [ServerLocation](../classes/_node_historyenv_serverlocation_.serverlocation.md)): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:147](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerLocation.ts#L147)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | keyof [ParsedUri](_uri_exports_.md#parseduri) |
`location` | [ServerLocation](../classes/_node_historyenv_serverlocation_.serverlocation.md) |

**Returns:** string

___

### replace

▸ **replace**(`key`: keyof [ParsedUri](_uri_exports_.md#parseduri), `value`: string, `location`: [ServerLocation](../classes/_node_historyenv_serverlocation_.serverlocation.md)): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:138](https://github.com/TylorS/typed-fp/blob/6ccb290/src/node/HistoryEnv/ServerLocation.ts#L138)*

#### Parameters:

Name | Type |
------ | ------ |
`key` | keyof [ParsedUri](_uri_exports_.md#parseduri) |
`value` | string |
`location` | [ServerLocation](../classes/_node_historyenv_serverlocation_.serverlocation.md) |

**Returns:** void
