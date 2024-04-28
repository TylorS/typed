/**
 * @since 1.0.0
 */

import type { Schema } from "@effect/schema/Schema"
import { getSchema, type MatchInput } from "@typed/router"
import { ApiRequest } from "effect-http"

/**
 * @since 1.0.0
 */
export * from "effect-http/ApiRequest"

/**
 * @since 1.0.0
 */
export const setRoute = <I extends MatchInput.Any>(
  route: I
): <B, _, Q, H, R1>(
  endpoint: ApiRequest.ApiRequest<B, _, Q, H, R1>
) => ApiRequest.ApiRequest<
  B,
  Schema.Type<MatchInput.Schema<I>>,
  Q,
  H,
  Schema.Context<MatchInput.Schema<I>> | R1
> => {
  const schema = getSchema(route)
  return ApiRequest.setPath<Schema.Type<typeof schema>, Schema.Context<typeof schema>>(schema)
}
