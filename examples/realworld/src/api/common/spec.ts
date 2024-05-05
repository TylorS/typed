import * as HttpClient from "@effect/platform/HttpClient"
import * as Http from "@effect/platform/HttpServer"
import * as Schema from "@typed/realworld/lib/Schema"
import { JwtToken } from "@typed/realworld/model"
import { Unauthorized } from "@typed/realworld/services/errors"
import type { ApiEndpoint, ApiRequest, ApiSchema } from "@typed/server"
import { Api, ApiResponse, Security } from "@typed/server"
import { Effect, Option } from "effect"

const jwtTokenSchema = Schema.String.pipe(
  Schema.transform(JwtToken, { decode: (f) => JwtToken(f.split(" ")[1]), encode: (t) => `Token ${t}` })
)

const getJwtTokenFromHeader = Http.request.ServerRequest.pipe(
  Effect.flatMap((request) => Http.headers.get(request.headers, "authorization")),
  Effect.flatMap(Schema.decode(jwtTokenSchema)),
  Effect.asSome,
  Effect.catchAll(() => Effect.succeedNone)
)

export const optionalJwtTokenSecurity = Security.make(getJwtTokenFromHeader, {
  jwtToken: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
})

export const jwtTokenSecurity = Security.make(getJwtTokenFromHeader, {}).pipe(
  Security.mapEffect((token) => Option.isSome(token) ? Effect.succeed(token.value) : new Unauthorized())
)

export type JwtTokenSecurity = typeof jwtTokenSecurity

export type OptionalJwtTokenSecurity = typeof optionalJwtTokenSecurity

export const addUnauthorizedResponse: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  ApiResponse.ApiResponse<401, ApiSchema.Ignored, ApiSchema.Ignored, never> | Response1,
  Security
> = Api.addResponse(ApiResponse.make(401))

export const addUnprocessableResponse: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  ApiResponse.ApiResponse<422, { readonly errors: ReadonlyArray<string> }, ApiSchema.Ignored, never> | Response1,
  Security
> = Api.addResponse(
  ApiResponse.make(422, Schema.Struct({ errors: Schema.Array(Schema.String) }))
)

export const add200: <A = void, I = void, R = never>(
  schema?: Schema.Schema<A, I, R> | undefined
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<200, A, ApiSchema.Ignored, R>, Security> =
  <A, I, R>(schema?: Schema.Schema<A, I, R>) => (endpoint) => Api.setResponse(ApiResponse.make(200, schema))(endpoint)

export const add201: <A, I, R>(
  schema: Schema.Schema<A, I, R>
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<201, A, ApiSchema.Ignored, R>, Security> = <A, I, R>(
  schema: Schema.Schema<A, I, R>
) => Api.setResponse(ApiResponse.make(201, schema))

export const addJwtTokenSecurity: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  Response,
  JwtTokenSecurity
> = Api.setSecurity(jwtTokenSecurity)

export const addOptionalJwtTokenSecurity: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  Response,
  OptionalJwtTokenSecurity
> = Api.setSecurity(optionalJwtTokenSecurity)

export const addJwtTokenToRequest =
  (token: JwtToken) => (request: HttpClient.request.ClientRequest): HttpClient.request.ClientRequest =>
    request.pipe(HttpClient.request.setHeader("Authorization", `Token ${token}`))

export const addOptionalJwtTokenToRequest =
  (token: Option.Option<JwtToken>) => (request: HttpClient.request.ClientRequest): HttpClient.request.ClientRequest =>
    Option.match(token, {
      onNone: () => request,
      onSome: (token) => request.pipe(HttpClient.request.setHeader("Authorization", `Token ${token}`))
    })
