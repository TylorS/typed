import * as Schema from "@/lib/Schema"
import { JwtToken } from "@/model"
import type { ApiEndpoint, ApiRequest, ApiSchema, SecurityScheme } from "effect-http"
import { Api, ApiResponse } from "effect-http"

const jwtTokenSchema = Schema.string.pipe(
  Schema.transform(JwtToken, (f) => JwtToken(f.split(" ")[1]), (t) => `Token ${t}`)
)

export const jwtTokenSecuritySchema: SecurityScheme.SecurityScheme<JwtToken> = {
  type: "http",
  options: {
    scheme: "bearer"
  },
  schema: jwtTokenSchema
}

export const addUnauthorizedResponse: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends ApiEndpoint.ApiSecurity.Any
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
  Security extends ApiEndpoint.ApiSecurity.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  ApiResponse.ApiResponse<422, { readonly errors: ReadonlyArray<string> }, ApiSchema.Ignored, never> | Response1,
  Security
> = Api.addResponse(
  ApiResponse.make(422, Schema.struct({ errors: Schema.array(Schema.string) }))
)

export const add200: <A = void, I = void, R = never>(
  schema?: Schema.Schema<A, I, R> | undefined
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends ApiEndpoint.ApiSecurity.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<200, A, ApiSchema.Ignored, R> | Response1, Security> =
  <A, I, R>(schema?: Schema.Schema<A, I, R>) => Api.addResponse(ApiResponse.make(200, schema))

export const add201: <A, I, R>(
  schema: Schema.Schema<A, I, R>
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends ApiEndpoint.ApiSecurity.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<201, A, ApiSchema.Ignored, R> | Response1, Security> =
  <A, I, R>(schema: Schema.Schema<A, I, R>) => Api.addResponse(ApiResponse.make(201, schema))

export const addJwtTokenSecurity: <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends ApiEndpoint.ApiSecurity.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint.ApiEndpoint<
  Id,
  Request,
  Response,
  Security & { jwtToken: SecurityScheme.SecurityScheme<JwtToken> }
> = Api.addSecurity("jwtToken", jwtTokenSecuritySchema)
