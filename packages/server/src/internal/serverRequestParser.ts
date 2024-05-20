import * as ServerRequest from "@effect/platform/Http/ServerRequest"
import type * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as ApiEndpoint from "effect-http/ApiEndpoint"
import * as ApiRequest from "effect-http/ApiRequest"
import * as ApiSchema from "effect-http/ApiSchema"
import * as HttpError from "effect-http/HttpError"
import * as Security from "effect-http/Security"
import * as Effect from "effect/Effect"
import * as Unify from "effect/Unify"
import { formatParseError } from "./formatParseError.js"

type Ctx = {
  searchParams: Record<string, any>
  params: Record<string, any>
}

interface ServerRequestParser {
  parseRequest: (
    request: ServerRequest.ServerRequest,
    context: Ctx
  ) => Effect.Effect<{ query: any; path: any; body: any; headers: any; security: any }, HttpError.HttpError>
}

const createError = (
  location: "query" | "path" | "body" | "headers",
  message: string
) =>
  HttpError.badRequest({
    error: "Request validation error",
    location,
    message
  })

const make = (
  parseRequest: ServerRequestParser["parseRequest"]
): ServerRequestParser => ({ parseRequest })

export const create = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
): ServerRequestParser => {
  const parseBody = createBodyParser(endpoint, parseOptions)
  const parseQuery = createQueryParser(endpoint, parseOptions)
  const parseHeaders = createHeadersParser(endpoint, parseOptions)
  const parseParams = createParamsParser(endpoint, parseOptions)
  const parseSecurity = createSecurityParser(endpoint)

  return make((request, context) =>
    Effect.all({
      body: parseBody(request),
      query: parseQuery(context),
      path: parseParams(context),
      headers: parseHeaders(request),
      security: parseSecurity(request)
    }) as any
  )
}

const createBodyParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getBodySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return Unify.unify((request: ServerRequest.ServerRequest) => {
    if (schema === ApiSchema.FormData) {
      // TODO
      return Effect.succeed(undefined)
    }

    return request.json.pipe(
      Effect.mapError((error) => {
        if (error.reason === "Transport") {
          return createError("body", "Unexpect request JSON body error")
        }

        return createError("body", "Invalid JSON")
      }),
      Effect.flatMap((request) =>
        parse(request, parseOptions).pipe(
          Effect.mapError((error) => createError("body", formatParseError(error, parseOptions)))
        )
      )
    )
  })
}

const createQueryParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getQuerySchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (context: Ctx) => {
    return parse(context.searchParams, parseOptions).pipe(
      Effect.mapError((error) => createError("query", formatParseError(error, parseOptions)))
    )
  }
}

const createHeadersParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getHeadersSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (request: ServerRequest.ServerRequest) =>
    parse(request.headers, parseOptions).pipe(
      Effect.mapError((error) => createError("headers", formatParseError(error, parseOptions)))
    )
}

const createSecurityParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any
) => {
  const security = ApiEndpoint.getSecurity(endpoint)

  return (request: ServerRequest.ServerRequest) =>
    Security.handleRequest(security).pipe(
      Effect.provideService(ServerRequest.ServerRequest, request)
    )
}

const createParamsParser = (
  endpoint: ApiEndpoint.ApiEndpoint.Any,
  parseOptions?: AST.ParseOptions
) => {
  const schema = ApiRequest.getPathSchema(ApiEndpoint.getRequest(endpoint))

  if (ApiSchema.isIgnored(schema)) {
    return () => Effect.succeed(undefined)
  }

  const parse = Schema.decodeUnknown(schema as Schema.Schema<any, any, never>)

  return (ctx: Ctx) =>
    parse(ctx.params, parseOptions).pipe(
      Effect.mapError((error) => createError("path", formatParseError(error, parseOptions)))
    )
}
