import * as Body from "@effect/platform/Http/Body"
import type * as Headers from "@effect/platform/Http/Headers"
import type * as ServerRequest from "@effect/platform/Http/ServerRequest"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"
import * as Schema from "@effect/schema/Schema"
import * as ApiEndpoint from "effect-http/ApiEndpoint"
import * as ApiResponse from "effect-http/ApiResponse"
import * as ApiSchema from "effect-http/ApiSchema"
import type * as Representation from "effect-http/Representation"
import * as ServerError from "effect-http/ServerError"
import * as Effect from "effect/Effect"
import { flow, pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/Array"
import { formatParseError } from "./formatParseError.js"

interface ServerResponseEncoder {
  encodeResponse: (
    request: ServerRequest.ServerRequest,
    inputResponse: unknown
  ) => Effect.Effect<ServerResponse.ServerResponse, ServerError.ServerError>
}

const createErrorResponse = (error: string, message: string) => ServerError.makeJson(500, { error, message })

const make = (
  encodeResponse: ServerResponseEncoder["encodeResponse"]
): ServerResponseEncoder => ({ encodeResponse })

export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
): ServerResponseEncoder => {
  const responses = ApiEndpoint.getResponse(endpoint)
  const isFullResponse = ApiEndpoint.isFullResponse(endpoint)
  const statusToSpec = responses.reduce(
    (obj, response) => ({ ...obj, [ApiResponse.getStatus(response)]: response }),
    {} as Record<number, ApiResponse.ApiResponse.Any>
  )

  return make((request, inputResponse) =>
    Effect.gen(function*(_) {
      const _input = isFullResponse ?
        yield* _(
          parseFullResponseInput(inputResponse),
          Effect.mapError(() => createErrorResponse("Invalid response", "Server handler returned unexpected response"))
        ) :
        { status: ApiResponse.getStatus(responses[0]), body: inputResponse }

      const response = statusToSpec[_input.status]
      const setBody = createBodySetter(response)
      const setHeaders = createHeadersSetter(response)

      const representation = representationFromRequest(
        ApiResponse.getRepresentations(response),
        request
      )

      return yield* _(
        ServerResponse.empty({ status: _input.status }).pipe(
          setBody(_input, representation),
          Effect.flatMap(setHeaders(_input))
        )
      )
    })
  )
}

const representationFromRequest = (
  representations: ReadonlyArray.NonEmptyReadonlyArray<Representation.Representation>,
  request: ServerRequest.ServerRequest
): Representation.Representation => {
  if (representations.length === 0) {
    representations[0]
  }

  const accept = request.headers["accept"]

  // TODO: this logic needs to be improved a lot!
  return pipe(
    representations,
    ReadonlyArray.filter(
      (representation) => representation.contentType === accept
    ),
    ReadonlyArray.head,
    Option.getOrElse(() => representations[0])
  )
}

const encodeBody = (schema: Schema.Schema<any, any, never>) => {
  const encode = Schema.encode(schema)

  return (body: unknown, representation: Representation.Representation) => (response: ServerResponse.ServerResponse) =>
    pipe(
      encode(body),
      Effect.mapError((error) => createErrorResponse("Invalid response body", formatParseError(error))),
      Effect.flatMap(
        flow(
          representation.stringify,
          Effect.mapError((error) => createErrorResponse("Invalid response body", error.message))
        )
      ),
      Effect.map((body) =>
        response.pipe(
          ServerResponse.setBody(
            Body.text(body, representation.contentType)
          )
        )
      )
    )
}

const createBodySetter = (response: ApiResponse.ApiResponse.Any) => {
  const body = ApiResponse.getBodySchema(response)
  const bodySchema = ApiSchema.isIgnored(body) ? undefined : body
  const encode = bodySchema && encodeBody(bodySchema as Schema.Schema<any, any, never>)

  return (
    inputResponse: FullResponseInput,
    representation: Representation.Representation
  ) =>
  (response: ServerResponse.ServerResponse) => {
    if (encode === undefined && inputResponse.body !== undefined) {
      return Effect.die("Unexpected response body")
    } else if (encode !== undefined && inputResponse.body === undefined) {
      return Effect.die("Response body not provided")
    } else if (encode === undefined) {
      return Effect.succeed(response)
    }

    return pipe(response, encode(inputResponse.body, representation))
  }
}

const createHeadersSetter = (schema: ApiResponse.ApiResponse.Any) => {
  const headers = ApiResponse.getHeadersSchema(schema)

  const parseHeaders = ApiSchema.isIgnored(headers)
    ? undefined
    : Schema.encode(headers as Schema.Schema<any, any, never>)

  return (inputResponse: FullResponseInput) => (response: ServerResponse.ServerResponse) => {
    if (parseHeaders === undefined && inputResponse.headers !== undefined) {
      return Effect.die("Unexpected response headers")
    } else if (
      parseHeaders !== undefined &&
      inputResponse.headers === undefined
    ) {
      return Effect.die("Response headers not provided")
    } else if (parseHeaders === undefined) {
      return Effect.succeed(response)
    }

    return parseHeaders(inputResponse.headers).pipe(
      Effect.map((headers) => response.pipe(ServerResponse.setHeaders(headers as Headers.Input))),
      Effect.mapError((error) =>
        createErrorResponse(
          "Invalid response headers",
          formatParseError(error)
        )
      )
    )
  }
}

const FullResponseInput = Schema.Struct({
  body: Schema.optional(Schema.Unknown),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  status: Schema.Number
})
type FullResponseInput = Schema.Schema.Type<typeof FullResponseInput>

const parseFullResponseInput = Schema.decodeUnknown(FullResponseInput)
