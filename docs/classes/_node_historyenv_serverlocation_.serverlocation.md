**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["node/HistoryEnv/ServerLocation"](../modules/_node_historyenv_serverlocation_.md) / ServerLocation

# Class: ServerLocation

An in-memory implementation of `Location`. Optionally mirror Location changes
into a History instance with setHistory.

## Hierarchy

* **ServerLocation**

## Implements

* Location

## Index

### Constructors

* [constructor](_node_historyenv_serverlocation_.serverlocation.md#constructor)

### Properties

* [history](_node_historyenv_serverlocation_.serverlocation.md#history)
* [href](_node_historyenv_serverlocation_.serverlocation.md#href)

### Accessors

* [ancestorOrigins](_node_historyenv_serverlocation_.serverlocation.md#ancestororigins)
* [hash](_node_historyenv_serverlocation_.serverlocation.md#hash)
* [host](_node_historyenv_serverlocation_.serverlocation.md#host)
* [hostname](_node_historyenv_serverlocation_.serverlocation.md#hostname)
* [origin](_node_historyenv_serverlocation_.serverlocation.md#origin)
* [pathname](_node_historyenv_serverlocation_.serverlocation.md#pathname)
* [port](_node_historyenv_serverlocation_.serverlocation.md#port)
* [protocol](_node_historyenv_serverlocation_.serverlocation.md#protocol)
* [search](_node_historyenv_serverlocation_.serverlocation.md#search)

### Methods

* [assign](_node_historyenv_serverlocation_.serverlocation.md#assign)
* [reload](_node_historyenv_serverlocation_.serverlocation.md#reload)
* [replace](_node_historyenv_serverlocation_.serverlocation.md#replace)
* [setHistory](_node_historyenv_serverlocation_.serverlocation.md#sethistory)
* [toString](_node_historyenv_serverlocation_.serverlocation.md#tostring)

## Constructors

### constructor

\+ **new ServerLocation**(`uri`: [Uri](../modules/_uri_exports_.uri.md)): [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md)

*Defined in [src/node/HistoryEnv/ServerLocation.ts:87](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L87)*

#### Parameters:

Name | Type |
------ | ------ |
`uri` | [Uri](../modules/_uri_exports_.uri.md) |

**Returns:** [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md)

## Properties

### history

• `Private` **history**: History

*Defined in [src/node/HistoryEnv/ServerLocation.ts:87](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L87)*

___

### href

•  **href**: string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:86](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L86)*

## Accessors

### ancestorOrigins

• get **ancestorOrigins**(): DOMStringList

*Defined in [src/node/HistoryEnv/ServerLocation.ts:12](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L12)*

**Returns:** DOMStringList

___

### hash

• get **hash**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:16](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L16)*

**Returns:** string

• set **hash**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:20](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### host

• get **host**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:26](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L26)*

**Returns:** string

• set **host**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:30](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L30)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### hostname

• get **hostname**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:34](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L34)*

**Returns:** string

• set **hostname**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:38](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L38)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### origin

• get **origin**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:83](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L83)*

**Returns:** string

___

### pathname

• get **pathname**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:42](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L42)*

**Returns:** string

• set **pathname**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:46](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L46)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### port

• get **port**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:50](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L50)*

**Returns:** string

• set **port**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:61](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L61)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### protocol

• get **protocol**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:65](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L65)*

**Returns:** string

• set **protocol**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:69](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L69)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

___

### search

• get **search**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:73](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L73)*

**Returns:** string

• set **search**(`value`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:77](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L77)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |

**Returns:** void

## Methods

### assign

▸ **assign**(`url`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:93](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`url` | string |

**Returns:** void

___

### reload

▸ **reload**(): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:103](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L103)*

**Returns:** void

___

### replace

▸ **replace**(`url`: string): void

*Defined in [src/node/HistoryEnv/ServerLocation.ts:105](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L105)*

#### Parameters:

Name | Type |
------ | ------ |
`url` | string |

**Returns:** void

___

### setHistory

▸ **setHistory**(`this`: [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md), `history`: History): [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md)

*Defined in [src/node/HistoryEnv/ServerLocation.ts:131](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L131)*

#### Parameters:

Name | Type |
------ | ------ |
`this` | [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md) |
`history` | History |

**Returns:** [ServerLocation](_node_historyenv_serverlocation_.serverlocation.md)

___

### toString

▸ **toString**(): string

*Defined in [src/node/HistoryEnv/ServerLocation.ts:126](https://github.com/TylorS/typed-fp/blob/41076ce/src/node/HistoryEnv/ServerLocation.ts#L126)*

**Returns:** string
