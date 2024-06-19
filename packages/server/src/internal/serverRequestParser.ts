import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as HttpError from "effect-http-error/HttpError"
import * as Security from "effect-http-security/Security"
import * as Effect from "effect/Effect"
import * as ApiEndpoint from "../ApiEndpoint.js"
import * as ApiRequest from "../ApiRequest.js"
import * as ApiSchema from "../ApiSchema.js"

type Ctx = {
  params: any
  queryParams: any
}

/** @internal */
interface ServerRequestParser {
  parseRequest: (ctx: Ctx) => Effect.Effect<
    { query: any; path: any; body: any; headers: any; security: any },
    HttpError.HttpError,
    ServerRequest.ServerRequest
  >
}

/** @internal */
const createError = (
  location: "query" | "path" | "body" | "headers",
  message: string
) =>
  HttpError.make(400, {
    error: "Request validation error",
    location,
    message
  })

/** @internal */
const make = (
  parseRequest: ServerRequestParser["parseRequest"]
): ServerRequestParser => ({ parseRequest })

/** @internal */
export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
): ServerRequestParser =>
  make(
    (ctx) =>
      Effect.all({
        body: parseBody(endpoint, parseOptions),
        query: parseQuery(endpoint, parseOptions),
        path: parsePath(ctx, endpoint, parseOptions),
        headers: parseHeaders(endpoint, parseOptions),
        security: parseSecurity(endpoint)
      })
  )

/** @internal */
const parseBody = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getBodySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  if (schema === ApiSchema.FormData) {
    // TODO
    return Effect.succeed(undefined)
  }

  return ServerRequest.ServerRequest.pipe(
    Effect.flatMap((request) => request.json),
    Effect.mapError((error) => {
      if (error.reason === "Transport") {
        return createError("body", "Unexpect request JSON body error")
      }

      return createError("body", "Invalid JSON")
    }),
    Effect.flatMap((request) =>
      parse(request, parseOptions).pipe(
        Effect.mapError((error) => createError("body", error.message))
      )
    )
  )
}

/** @internal */
const parseQuery = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getQuerySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  return Effect.mapError(
    ServerRequest.schemaSearchParams(schema, parseOptions),
    (error) => createError("query", error.message)
  )
}

/** @internal */
const parseHeaders = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getHeadersSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return ServerRequest.ServerRequest.pipe(
    Effect.flatMap((request) => parse(request.headers, parseOptions)),
    Effect.mapError((error) => createError("headers", error.message))
  )
}

/** @internal */
const parseSecurity = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  const security = ApiEndpoint.getSecurity(endpoint)

  return Security.handleRequest(security)
}

/** @internal */
const parsePath = (
  ctx: Ctx,
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getPathSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return Effect.mapError(parse(ctx.params, parseOptions), (error) => createError("path", error.message))
}
