import * as ParseResult from '@effect/schema/ParseResult'
import * as S from '@effect/schema/Schema'

import type { Decoder } from './decoder.js'
import { fromSchema } from './primitives.js'

export const json = fromSchema(S.json)

export const jsonParse: Decoder<string, S.Json> = (input, options) => {
  try {
    return json(JSON.parse(input), options)
  } catch {
    return ParseResult.failure(ParseResult.type(json.ast, input))
  }
}
