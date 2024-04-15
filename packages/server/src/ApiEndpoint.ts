/**
 * @since 1.0.0
 */

import type { Method } from "@effect/platform/Http/Method"
import { getPropertySignatures } from "@effect/schema/AST"
import type { Schema } from "@effect/schema/Schema"
import type { MatchInput } from "@typed/router"
import { getPath, getSchema } from "@typed/router"
import { ApiRequest, ApiResponse, ApiSchema, Security } from "effect-http"
import { ApiEndpoint } from "effect-http"

export {
  /**
   * @since 1.0.0
   */
  addResponse,
  /**
   * @since 1.0.0
   */
  ApiEndpoint,
  /**
   * @since 1.0.0
   */
  Options,
  /**
   * @since 1.0.0
   */
  setRequest,
  /**
   * @since 1.0.0
   */
  setRequestBody,
  /**
   * @since 1.0.0
   */
  setRequestHeaders,
  /**
   * @since 1.0.0
   */
  setRequestPath,
  /**
   * @since 1.0.0
   */
  setRequestQuery,
  /**
   * @since 1.0.0
   */
  setResponse,
  /**
   * @since 1.0.0
   */
  setResponseBody,
  /**
   * @since 1.0.0
   */
  setResponseHeaders,
  /**
   * @since 1.0.0
   */
  setResponseRepresentations,
  /**
   * @since 1.0.0
   */
  setResponseStatus,
  /**
   * @since 1.0.0
   */
  setSecurity
} from "effect-http/ApiEndpoint"

/**
 * @since 1.0.0
 */
export function setRequestRoute<I extends MatchInput.Any>(
  route: I
): <
  Id extends string,
  B,
  _,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  S extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<
    Id,
    ApiRequest.ApiRequest<B, _, Q, H, R1>,
    Response,
    S
  >
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    B,
    GetSchemaType<I>,
    Q,
    H,
    MatchInput.Context<I> | R1
  >,
  Response,
  S
> {
  const schema = getSchemaType(route)
  if (ApiSchema.isIgnored(schema)) {
    return (endpoint) => endpoint as any
  }
  return ApiEndpoint.setRequestPath(schema as any) as any
}

type GetSchemaType<I extends MatchInput.Any> = MatchInput.HasParams<I> extends true
  ? Schema.Type<MatchInput.Schema<I>>
  : ApiSchema.Ignored

export function make<
  M extends Method,
  const Id extends string,
  I extends MatchInput.Any,
  O extends ApiEndpoint.Options
>(
  method: M,
  id: Id,
  route: I,
  options: O
): ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaType<I>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> {
  const path = getPath(route)
  const schema = getSchemaType(route)

  if (ApiSchema.isIgnored(schema)) { 
    return ApiEndpoint.make(method, id, path, options) as any
  }
  
  return ApiEndpoint.make(method, id, path, options).pipe(
    ApiEndpoint.setRequestPath(schema as any)
  ) as any
}

function getSchemaType<I extends MatchInput.Any>(input: I): GetSchemaType<I> {
  const schema: Schema.Any = getSchema(input)
  const propertySignature = getPropertySignatures(schema.ast)
  if (propertySignature.length === 0) {
    return ApiSchema.Ignored as any
  } else {
    return schema as any
  }
}

const makeWithMethod = <M extends Method>(
  method: M
) =>
  <
    const Id extends string,
    I extends MatchInput.Any,
    O extends ApiEndpoint.Options
  >(id: Id, route: I, options: O) => make(method, id, route, options)

const delete_ = makeWithMethod("DELETE")

export {
  /**
   * @since 1.0.0
   */
  delete_ as delete
}

/**
 * @since 1.0.0
 */
export const get: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaType<I>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("GET")

/**
 * @since 1.0.0
 */
export const patch: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaType<I>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("PATCH")

/**
 * @since 1.0.0
 */
export const post: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaType<I>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("POST")

/**
 * @since 1.0.0
 */
export const put: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaType<I>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("PUT")
