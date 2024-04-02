/**
 * @since 1.0.0
 */

import type { Method } from "@effect/platform/Http/Method"
import type { Schema } from "@effect/schema/Schema"
import type { MatchInput } from "@typed/router"
import { getPath, getSchema } from "@typed/router"
import type { ApiRequest, ApiResponse, ApiSchema, Security } from "effect-http"
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
    Schema.Type<MatchInput.Schema<I>>,
    Q,
    H,
    Schema.Context<MatchInput.Schema<I>> | R1
  >,
  Response,
  S
> {
  const schema = getSchema(route)
  return ApiEndpoint.setRequestPath<Schema.Type<typeof schema>, Schema.Context<typeof schema>>(schema)
}

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
    Schema.Type<MatchInput.Schema<I>>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    Schema.Context<MatchInput.Schema<I>>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> {
  const path = getPath(route)
  const schema = getSchema(route)
  return ApiEndpoint.make(method, id, path, options).pipe(
    ApiEndpoint.setRequestPath<Schema.Type<typeof schema>, Schema.Context<typeof schema>>(schema)
  )
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
    Schema.Type<MatchInput.Schema<I>>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    Schema.Context<MatchInput.Schema<I>>
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
    Schema.Type<MatchInput.Schema<I>>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    Schema.Context<MatchInput.Schema<I>>
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
    Schema.Type<MatchInput.Schema<I>>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    Schema.Context<MatchInput.Schema<I>>
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
    Schema.Type<MatchInput.Schema<I>>,
    ApiSchema.Ignored,
    ApiSchema.Ignored,
    Schema.Context<MatchInput.Schema<I>>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
> = makeWithMethod("PUT")
