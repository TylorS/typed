import * as ParseResult from '@fp-ts/schema/ParseResult'
import * as Json from '@fp-ts/schema/data/Json'

import type { Decoder } from './decoder.js'
import { fromSchema } from './primitives.js'

export const json = fromSchema(Json.json)

export const jsonParse: Decoder<string, Json.Json> = (input, options) => {
  try {
    return json(JSON.parse(input), options)
  } catch {
    return ParseResult.failure(ParseResult.type(json.ast, input))
  }
}
