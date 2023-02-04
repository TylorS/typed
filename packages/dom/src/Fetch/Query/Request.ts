import * as Request from '@effect/query/Request'
import type { Schema } from '@fp-ts/schema/Schema'
import type { Decoder } from '@typed/decoder'

import type {
  FetchError,
  FetchJsonResponse,
  FetchInput,
  FetchInit,
  FetchTextResponse,
  DecodeError,
  FetchDecodeInit,
} from '@typed/dom/Fetch'

export type FetchRequest<A = unknown> =
  | FetchJson
  | FetchText
  | FetchDecodeJson<A>
  | FetchDecodeText<A>
  | FetchSchema<A>

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
  extends Request.Request<FetchError | DecodeError, FetchJsonResponse<A>> {
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
  extends Request.Request<FetchError | DecodeError, FetchJsonResponse<A>> {
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

export interface FetchSchema<A>
  extends Request.Request<FetchError | DecodeError, FetchJsonResponse<A>> {
  readonly _tag: 'FetchSchema'
  readonly input: FetchInput
  readonly schema: Schema<A>
  readonly init?: FetchDecodeInit
}

export const FetchSchema = <A>(
  input: FetchInput,
  schema: Schema<A>,
  init?: FetchDecodeInit,
): FetchSchema<A> => Request.tagged<FetchSchema<A>>('FetchSchema')({ input, schema, init })
