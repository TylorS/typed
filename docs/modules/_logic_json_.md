**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/json"

# Module: "logic/json"

## Index

### Enumerations

* [Tag](../enums/_logic_json_.tag.md)

### Interfaces

* [JsonSerializableRecord](../interfaces/_logic_json_.jsonserializablerecord.md)

### Type aliases

* [JSON\_TAG](_logic_json_.md#json_tag)
* [JsonPrimitive](_logic_json_.md#jsonprimitive)
* [JsonSerializable](_logic_json_.md#jsonserializable)
* [TaggedJson](_logic_json_.md#taggedjson)
* [TaggedJsonValues](_logic_json_.md#taggedjsonvalues)
* [VALUES\_TAG](_logic_json_.md#values_tag)

### Variables

* [JSON\_TAG](_logic_json_.md#json_tag)
* [VALUES\_TAG](_logic_json_.md#values_tag)

### Functions

* [fromJson](_logic_json_.md#fromjson)
* [hasJsonTag](_logic_json_.md#hasjsontag)
* [hasValuesTag](_logic_json_.md#hasvaluestag)
* [jsonReplace](_logic_json_.md#jsonreplace)
* [jsonRevive](_logic_json_.md#jsonrevive)
* [replaceJson](_logic_json_.md#replacejson)
* [reviveJson](_logic_json_.md#revivejson)
* [reviveMapEntries](_logic_json_.md#revivemapentries)
* [reviveSetEntries](_logic_json_.md#revivesetentries)
* [toJson](_logic_json_.md#tojson)

## Type aliases

### JSON\_TAG

Ƭ  **JSON\_TAG**: *typeof* [JSON\_TAG](_logic_json_.md#json_tag)

*Defined in [src/logic/json.ts:44](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L44)*

___

### JsonPrimitive

Ƭ  **JsonPrimitive**: Exclude\<Json, JsonRecord \| JsonArray>

*Defined in [src/logic/json.ts:14](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L14)*

___

### JsonSerializable

Ƭ  **JsonSerializable**: [JsonPrimitive](_logic_json_.md#jsonprimitive) \| Date \| ReadonlyArray\<[JsonSerializable](_logic_json_.md#jsonserializable)> \| [JsonSerializableRecord](../interfaces/_logic_json_.jsonserializablerecord.md) \| ReadonlyMap\<[JsonSerializable](_logic_json_.md#jsonserializable), [JsonSerializable](_logic_json_.md#jsonserializable)> \| ReadonlySet\<[JsonSerializable](_logic_json_.md#jsonserializable)> \| symbol

*Defined in [src/logic/json.ts:5](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L5)*

___

### TaggedJson

Ƭ  **TaggedJson**\<A>: { [JSON_TAG]: A ; [VALUES_TAG]: TaggedJsonValues[A]  }

*Defined in [src/logic/json.ts:65](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L65)*

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [Tag](../enums/_logic_json_.tag.md) |

#### Type declaration:

Name | Type |
------ | ------ |
`[JSON_TAG]` | A |
`[VALUES_TAG]` | TaggedJsonValues[A] |

___

### TaggedJsonValues

Ƭ  **TaggedJsonValues**: { [Tag.Date]: string ; [Tag.Map]: ReadonlyArray\<readonly [Json, Json]> ; [Tag.Set]: ReadonlyArray\<Json> ; [Tag.SymbolFor]: string ; [Tag.Symbol]: string  }

*Defined in [src/logic/json.ts:57](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L57)*

#### Type declaration:

Name | Type |
------ | ------ |
`[Tag.Date]` | string |
`[Tag.Map]` | ReadonlyArray\<readonly [Json, Json]> |
`[Tag.Set]` | ReadonlyArray\<Json> |
`[Tag.SymbolFor]` | string |
`[Tag.Symbol]` | string |

___

### VALUES\_TAG

Ƭ  **VALUES\_TAG**: *typeof* [VALUES\_TAG](_logic_json_.md#values_tag)

*Defined in [src/logic/json.ts:47](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L47)*

## Variables

### JSON\_TAG

• `Const` **JSON\_TAG**: \"\_\_json\_tag\_\_\" = '\_\_json\_tag\_\_' as const

*Defined in [src/logic/json.ts:43](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L43)*

___

### VALUES\_TAG

• `Const` **VALUES\_TAG**: \"\_\_values\_tag\_\_\" = '\_\_values\_tag\_\_' as const

*Defined in [src/logic/json.ts:46](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L46)*

## Functions

### fromJson

▸ **fromJson**(`jsonString`: string): [JsonSerializable](_logic_json_.md#jsonserializable)

*Defined in [src/logic/json.ts:32](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L32)*

Convert a JSON string into runtime JsonSerializable values.

#### Parameters:

Name | Type |
------ | ------ |
`jsonString` | string |

**Returns:** [JsonSerializable](_logic_json_.md#jsonserializable)

___

### hasJsonTag

▸ `Const`**hasJsonTag**(`x`: unknown): boolean

*Defined in [src/logic/json.ts:70](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L70)*

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** boolean

___

### hasValuesTag

▸ `Const`**hasValuesTag**(`x`: unknown): boolean

*Defined in [src/logic/json.ts:71](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L71)*

#### Parameters:

Name | Type |
------ | ------ |
`x` | unknown |

**Returns:** boolean

___

### jsonReplace

▸ `Const`**jsonReplace**(`serializable`: [JsonSerializable](_logic_json_.md#jsonserializable)): Json

*Defined in [src/logic/json.ts:22](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L22)*

Replace a JsonSerializable value with a JSON-friendly equivalent. Does not support circular
structures.

#### Parameters:

Name | Type |
------ | ------ |
`serializable` | [JsonSerializable](_logic_json_.md#jsonserializable) |

**Returns:** Json

___

### jsonRevive

▸ `Const`**jsonRevive**(`json`: Json): [JsonSerializable](_logic_json_.md#jsonserializable)

*Defined in [src/logic/json.ts:27](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L27)*

Replace a Serialized piece of Json with it's runtime equivalent.

#### Parameters:

Name | Type |
------ | ------ |
`json` | Json |

**Returns:** [JsonSerializable](_logic_json_.md#jsonserializable)

___

### replaceJson

▸ **replaceJson**(`_`: [JsonSerializable](_logic_json_.md#jsonserializable), `value`: [JsonSerializable](_logic_json_.md#jsonserializable)): Json

*Defined in [src/logic/json.ts:74](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L74)*

#### Parameters:

Name | Type |
------ | ------ |
`_` | [JsonSerializable](_logic_json_.md#jsonserializable) |
`value` | [JsonSerializable](_logic_json_.md#jsonserializable) |

**Returns:** Json

___

### reviveJson

▸ **reviveJson**(`_`: Json, `value`: Json): [JsonSerializable](_logic_json_.md#jsonserializable)

*Defined in [src/logic/json.ts:109](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L109)*

#### Parameters:

Name | Type |
------ | ------ |
`_` | Json |
`value` | Json |

**Returns:** [JsonSerializable](_logic_json_.md#jsonserializable)

___

### reviveMapEntries

▸ **reviveMapEntries**(`entries`: ReadonlyArray\<readonly [Json, Json]>): ReadonlyArray\<readonly [[JsonSerializable](_logic_json_.md#jsonserializable), [JsonSerializable](_logic_json_.md#jsonserializable)]>

*Defined in [src/logic/json.ts:137](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L137)*

#### Parameters:

Name | Type |
------ | ------ |
`entries` | ReadonlyArray\<readonly [Json, Json]> |

**Returns:** ReadonlyArray\<readonly [[JsonSerializable](_logic_json_.md#jsonserializable), [JsonSerializable](_logic_json_.md#jsonserializable)]>

___

### reviveSetEntries

▸ **reviveSetEntries**(`entries`: ReadonlyArray\<Json>): ReadonlyArray\<[JsonSerializable](_logic_json_.md#jsonserializable)>

*Defined in [src/logic/json.ts:133](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L133)*

#### Parameters:

Name | Type |
------ | ------ |
`entries` | ReadonlyArray\<Json> |

**Returns:** ReadonlyArray\<[JsonSerializable](_logic_json_.md#jsonserializable)>

___

### toJson

▸ **toJson**\<A>(`x`: A, `space?`: string \| number): string

*Defined in [src/logic/json.ts:39](https://github.com/TylorS/typed-fp/blob/41076ce/src/logic/json.ts#L39)*

Converts JsonSerializable values into a JSON-encoded format.

#### Type parameters:

Name | Type |
------ | ------ |
`A` | [JsonSerializable](_logic_json_.md#jsonserializable) |

#### Parameters:

Name | Type |
------ | ------ |
`x` | A |
`space?` | string \| number |

**Returns:** string
