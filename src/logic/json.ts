import { Json, JsonArray, JsonRecord } from 'fp-ts/Either'

import { isObject } from './isObject'

export type JsonSerializable =
  | JsonPrimitive
  | Date
  | ReadonlyArray<JsonSerializable>
  | JsonSerializableRecord
  | ReadonlyMap<JsonSerializable, JsonSerializable>
  | ReadonlySet<JsonSerializable>
  | symbol

export type JsonPrimitive = Exclude<Json, JsonRecord | JsonArray>

export interface JsonSerializableRecord extends Record<string, JsonSerializable> {}

export const jsonReplace = (serializable: JsonSerializable) => replaceJson('', serializable)
export const jsonRevive = (json: Json) => reviveJson('', json)

export function fromJson(jsonString: string): JsonSerializable {
  return JSON.parse(jsonString, reviveJson)
}

export function toJson<A extends JsonSerializable>(x: A, space?: string | number): string {
  return JSON.stringify(x, replaceJson, space)
}

const JSON_TAG = '__json_tag__' as const
type JSON_TAG = typeof JSON_TAG

const VALUES_TAG = '__values_tag__' as const
type VALUES_TAG = typeof VALUES_TAG

enum Tag {
  Set,
  Map,
  Symbol,
  SymbolFor,
}

type TaggedJsonValues = {
  [Tag.Map]: ReadonlyArray<readonly [Json, Json]>
  [Tag.Set]: ReadonlyArray<Json>
  [Tag.Symbol]: string
  [Tag.SymbolFor]: string
}

type TaggedJson<A extends Tag> = {
  readonly [JSON_TAG]: A
  readonly [VALUES_TAG]: TaggedJsonValues[A]
}

const hasJsonTag = (x: unknown) => Object.prototype.hasOwnProperty.call(x, JSON_TAG)
const hasValuesTag = (x: unknown) => Object.prototype.hasOwnProperty.call(x, VALUES_TAG)

// Replace
function replaceJson(_: JsonSerializable, value: JsonSerializable): Json {
  if (value instanceof Set) {
    return { [JSON_TAG]: Tag.Set, [VALUES_TAG]: Array.from(value).map((x, i) => replaceJson(i, x)) }
  }

  if (value instanceof Map) {
    return {
      [JSON_TAG]: Tag.Map,
      [VALUES_TAG]: Array.from(value.entries()).map(([key, value]) => [
        replaceJson(key, key),
        replaceJson(key, value),
      ]),
    }
  }

  if (typeof value === 'symbol') {
    const key = Symbol.keyFor(value)

    return {
      [JSON_TAG]: key ? Tag.SymbolFor : Tag.Symbol,
      [VALUES_TAG]: key ?? value.description ?? '',
    }
  }

  return value as Json
}

// Revive
function reviveJson(_: Json, value: Json): JsonSerializable {
  if (isObject(value) && hasJsonTag(value) && hasValuesTag(value)) {
    const { [JSON_TAG]: tag } = value as TaggedJson<Tag>

    if (tag === Tag.Set) {
      return new Set(reviveSetEntries((value as TaggedJson<Tag.Set>)[VALUES_TAG]))
    }

    if (tag === Tag.Map) {
      return new Map(reviveMapEntries((value as TaggedJson<Tag.Map>)[VALUES_TAG]))
    }

    if (tag === Tag.Symbol) {
      return Symbol(((tag as unknown) as TaggedJson<Tag.Symbol>)[VALUES_TAG])
    }

    if (tag === Tag.SymbolFor) {
      return Symbol.for(((tag as unknown) as TaggedJson<Tag.SymbolFor>)[VALUES_TAG])
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
