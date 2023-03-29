import * as Request from '@effect/query/Request'
import type { ParseError } from '@effect/schema/ParseResult'
import type { Schema } from '@effect/schema/Schema'
import type { Decoder } from '@typed/decoder'

import type {
  FetchError,
  FetchJsonResponse,
  FetchInput,
  FetchInit,
  FetchTextResponse,
  FetchDecodeInit,
} from '@typed/dom/Fetch'

export type FetchRequest<O = unknown> =
  | FetchJson
  | FetchText
  | FetchDecodeJson<O>
  | FetchDecodeText<O>
  | FetchSchema<any, O>

export interface FetchJson extends Request.Request<FetchError, FetchJsonResponse> {
  readonly _tag: 'FetchJson'
  readonly input: FetchInput
  readonly init?: FetchInit
}

export const FetchJson = (input: FetchInput, init?: FetchInit): FetchJson =>
  Request.tagged<FetchJson>('FetchJson')({ input, init })

export interface FetchText extends Request.Request<FetchError, FetchTextResponse> {
  readonly _tag: 'FetchText'
  readonly input: FetchInput
  readonly init?: FetchInit
}

export const FetchText = (input: FetchInput, init?: FetchInit): FetchText =>
  Request.tagged<FetchText>('FetchText')({ input, init })

export interface FetchDecodeJson<A>
  extends Request.Request<FetchError | ParseError, FetchJsonResponse<A>> {
  readonly _tag: 'FetchDecodeJson'
  readonly input: FetchInput
  readonly decoder: Decoder<unknown, A>
  readonly init?: FetchDecodeInit
}

export const FetchDecodeJson = <A>(
  input: FetchInput,
  decoder: Decoder<unknown, A>,
  init?: FetchDecodeInit,
): FetchDecodeJson<A> =>
  Request.tagged<FetchDecodeJson<A>>('FetchDecodeJson')({ input, decoder, init })

export interface FetchDecodeText<A>
  extends Request.Request<FetchError | ParseError, FetchJsonResponse<A>> {
  readonly _tag: 'FetchDecodeText'
  readonly input: FetchInput
  readonly decoder: Decoder<string, A>
  readonly init?: FetchDecodeInit
}

export const FetchDecodeText = <A>(
  input: FetchInput,
  decoder: Decoder<string, A>,
  init?: FetchInit,
): FetchDecodeText<A> =>
  Request.tagged<FetchDecodeText<A>>('FetchDecodeText')({ input, decoder, init })

export interface FetchSchema<I, A>
  extends Request.Request<FetchError | ParseError, FetchJsonResponse<A>> {
  readonly _tag: 'FetchSchema'
  readonly input: FetchInput
  readonly schema: Schema<I, A>
  readonly init?: FetchDecodeInit
}

export const FetchSchema = <I, A>(
  input: FetchInput,
  schema: Schema<I, A>,
  init?: FetchDecodeInit,
): FetchSchema<I, A> => Request.tagged<FetchSchema<I, A>>('FetchSchema')({ input, schema, init })
