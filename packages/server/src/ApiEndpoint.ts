/**
 * @since 1.0.0
 */

import type { Method } from "@effect/platform/Http/Method"
import type { PathInput } from "@effect/platform/Http/Router"
import { getPropertySignatures } from "@effect/schema/AST"
import type { Schema } from "@effect/schema/Schema"
import type { MatchInput } from "@typed/router"
import { getPath, getPathSchema, getQuerySchema } from "@typed/router"
import type { ApiRequest, ApiResponse } from "effect-http"
import { ApiEndpoint, ApiSchema } from "effect-http"
import type * as Security from "effect-http-security/Security"
import { flow } from "effect/Function"

export {
  /**
   * @since 1.0.0
   */
  addResponse,
  /**
   * @since 1.0.0
   */
  type ApiEndpoint,
  /**
   * @since 1.0.0
   */
  type Options,
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
 type */
export function setRequestRoute<I extends MatchInput.Any>(
  route: I
): <
  Id extends string,
  B,
  P,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  S extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<
    Id,
    ApiRequest.ApiRequest<B, P, Q, H, R1>,
    Response,
    S
  >
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    B,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    H,
    MatchInput.Context<I> | R1
  >,
  Response,
  S
> {
  const path = getPathType(route)
  const query = getQueryType(route)

  const pathIgnored = ApiSchema.isIgnored(path)
  const queryIgnored = ApiSchema.isIgnored(query)

  if (pathIgnored && queryIgnored) {
    return (endpoint) => endpoint as any
  } else if (pathIgnored) {
    return ApiEndpoint.setRequestQuery(query as any) as any
  } else if (queryIgnored) {
    return ApiEndpoint.setRequestPath(path as any) as any
  } else {
    return flow(ApiEndpoint.setRequestPath(path as any), ApiEndpoint.setRequestQuery(query as any)) as any
  }
}

type GetSchemaPathType<I extends MatchInput.Any> = MatchInput.HasPathParams<I> extends true
  ? Schema.Type<MatchInput.PathSchema<I>>
  : ApiSchema.Ignored

type GetSchemaQueryType<I extends MatchInput.Any> = MatchInput.HasQueryParams<I> extends true
  ? Schema.Type<MatchInput.QuerySchema<I>>
  : ApiSchema.Ignored

/**
 * @since 1.0.0
 */
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
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> {
  const path = getPath(route) as PathInput
  const endpoint = ApiEndpoint.make(method, id, path, options) as any
  return setRequestRoute(route)(endpoint)
}

function getPathType<I extends MatchInput.Any>(input: I): GetSchemaPathType<I> {
  const schema: Schema.Any = getPathSchema(input)
  const propertySignature = getPropertySignatures(schema.ast)
  if (propertySignature.length === 0) {
    return ApiSchema.Ignored as any
  } else {
    return schema as any
  }
}

function getQueryType<I extends MatchInput.Any>(input: I): GetSchemaQueryType<I> {
  const schema: Schema.Any = getQuerySchema(input)
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
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
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
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
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
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
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
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("PUT")

/**
 * @since 1.0.0
 */
export const head: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("HEAD")

/**
 * @since 1.0.0
 */
export const options: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("OPTIONS")
