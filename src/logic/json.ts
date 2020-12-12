import { Json, JsonArray, JsonRecord } from 'fp-ts/Either'

import { isObject } from './isObject'

export type JsonSerializable =
  | JsonPrimitive
  | Date
  | BigInt
  | ReadonlyArray<JsonSerializable>
  | JsonSerializableRecord
  | ReadonlyMap<JsonSerializable, JsonSerializable>
  | ReadonlySet<JsonSerializable>
  | symbol

export type JsonPrimitive = Exclude<Json, JsonRecord | JsonArray>

export interface JsonSerializableRecord extends Record<string, JsonSerializable> {}

/**
 * Replace a JsonSerializable value with a JSON-friendly equivalent. Does not support circular
 * structures.
 */
export const jsonReplace = (serializable: JsonSerializable) => replaceJson('', serializable)

/**
 * Replace a Serialized piece of Json with it's runtime equivalent.
 */
export const jsonRevive = (json: Json) => reviveJson('', json)

/**
 * Convert a JSON string into runtime JsonSerializable values.
 */
export function fromJson(jsonString: string): JsonSerializable {
  return JSON.parse(jsonString, reviveJson)
}

/**
 * Converts JsonSerializable values into a JSON-encoded format.
 */
export function toJson<A extends JsonSerializable>(x: A, space?: string | number): string {
  return JSON.stringify(x, replaceJson, space)
}

export const JSON_TAG = '__json_tag__' as const
export type JSON_TAG = typeof JSON_TAG

export const VALUES_TAG = '__values_tag__' as const
export type VALUES_TAG = typeof VALUES_TAG

export enum JsonTag {
  Set,
  Map,
  Symbol,
  SymbolFor,
  Date,
  BigInt,
}

export type TaggedJsonValues = {
  [JsonTag.Map]: ReadonlyArray<readonly [Json, Json]>
  [JsonTag.Set]: ReadonlyArray<Json>
  [JsonTag.Symbol]: string
  [JsonTag.SymbolFor]: string
  [JsonTag.Date]: string
  [JsonTag.BigInt]: string
}

export type TaggedJson<A extends JsonTag> = {
  readonly [JSON_TAG]: A
  readonly [VALUES_TAG]: TaggedJsonValues[A]
}

export const hasJsonTag = (x: unknown) => Object.prototype.hasOwnProperty.call(x, JSON_TAG)
export const hasValuesTag = (x: unknown) => Object.prototype.hasOwnProperty.call(x, VALUES_TAG)

// Replace
function replaceJson(_: JsonSerializable, value: JsonSerializable): Json {
  if (value instanceof Set) {
    return {
      [JSON_TAG]: JsonTag.Set,
      [VALUES_TAG]: Array.from(value).map((x, i) => replaceJson(i, x)),
    }
  }

  if (value instanceof Map) {
    return {
      [JSON_TAG]: JsonTag.Map,
      [VALUES_TAG]: Array.from(value.entries()).map(([key, value]) => [
        replaceJson(key, key),
        replaceJson(key, value),
      ]),
    }
  }

  if (value instanceof Date) {
    return {
      [JSON_TAG]: JsonTag.Date,
      [VALUES_TAG]: value.toString(),
    }
  }

  if (value instanceof BigInt) {
    return {
      [JSON_TAG]: JsonTag.BigInt,
      [VALUES_TAG]: value.toString(),
    }
  }

  if (typeof value === 'symbol') {
    return {
      [JSON_TAG]: Symbol.keyFor(value) ? JsonTag.SymbolFor : JsonTag.Symbol,
      [VALUES_TAG]: value.description ?? '',
    }
  }

  return value as Json
}

// Revive
function reviveJson(_: Json, value: Json): JsonSerializable {
  if (isObject(value) && hasJsonTag(value) && hasValuesTag(value)) {
    const { [JSON_TAG]: tag } = value as TaggedJson<JsonTag>

    if (tag === JsonTag.Set) {
      return new Set(reviveSetEntries((value as TaggedJson<JsonTag.Set>)[VALUES_TAG]))
    }

    if (tag === JsonTag.Map) {
      return new Map(reviveMapEntries((value as TaggedJson<JsonTag.Map>)[VALUES_TAG]))
    }

    if (tag === JsonTag.Symbol) {
      return Symbol(((tag as unknown) as TaggedJson<JsonTag.Symbol>)[VALUES_TAG])
    }

    if (tag === JsonTag.SymbolFor) {
      return Symbol.for(((tag as unknown) as TaggedJson<JsonTag.SymbolFor>)[VALUES_TAG])
    }
  }

  return value as JsonSerializable
}

function reviveSetEntries(entries: ReadonlyArray<Json>): ReadonlyArray<JsonSerializable> {
  return entries.map((e, i) => reviveJson(i, e))
}

function reviveMapEntries(
  entries: ReadonlyArray<readonly [Json, Json]>,
): ReadonlyArray<readonly [JsonSerializable, JsonSerializable]> {
  return entries.map((e) => [reviveJson(e[0], e[0]), reviveJson(e[0], e[1])] as const)
}
