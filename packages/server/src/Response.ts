/**
 * @since 1.0.0
 */

import * as ServerHeaders from "@effect/platform/Http/Headers"
import * as ServerResponse from "@effect/platform/Http/ServerResponse"

/**
 * @since 1.0.0
 */
export * from "@effect/platform/Http/ServerResponse"

/**
 * @since 1.0.0
 */
export const seeOther = (location: string): ServerResponse.ServerResponse =>
  ServerResponse.empty({
    status: 303,
    headers: ServerHeaders.fromInput({ location })
  })
