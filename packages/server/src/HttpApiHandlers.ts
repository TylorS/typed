/**
 * @since 1.0.0
 */
import type { HttpApp, HttpRouter } from "@effect/platform"
import { type Chunk, identity, type Types } from "effect"
import type { Pipeable } from "effect/Pipeable"
import { pipeArguments } from "effect/Pipeable"
import type * as HttpApiEndpoint from "./HttpApiEndpoint.js"
import type * as HttpApiGroup from "./HttpApiGroup.js"

/**
 * @since 1.0.0
 */
export const HttpApiHandlersTypeId = Symbol.for(
  "@typed/server/HttpApiHandlers"
)
/**
 * @since 1.0.0
 */
export type HttpApiHandlersTypeId = typeof HttpApiHandlersTypeId

/**
 * @since 1.0.0
 */
export interface HttpApiHandlers<
  E,
  R,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any = never
> extends Pipeable {
  readonly [HttpApiHandlersTypeId]: {
    readonly _Endpoints: Types.Covariant<Endpoints>
  }
  readonly group: HttpApiGroup.HttpApiGroup<
    any,
    HttpApiEndpoint.HttpApiEndpoint.Any,
    any,
    R
  >
  readonly handlers: Chunk.Chunk<HttpApiHandlers.Item<E, R>>
}

/**
 * @since 1.0.0
 */
export namespace HttpApiHandlers {
  /**
   * @since 1.0.0
   * @category handlers
   */
  /**
   * @since 1.0.0
   */
  export type Middleware<E, R, E1, R1> = (
    self: HttpRouter.Route.Middleware<E, R>
  ) => HttpApp.Default<E1, R1>

  /**
   * @since 1.0.0
   * @category handlers
   */
  /**
   * @since 1.0.0
   */
  export type Item<E, R> =
    | {
      readonly _tag: "Handler"
      readonly endpoint: HttpApiEndpoint.HttpApiEndpoint.Any
      readonly handler: HttpApiEndpoint.HttpApiEndpoint.Handler<
        any,
        any,
        any
      >
      readonly withFullResponse: boolean
    }
    | {
      readonly _tag: "Middleware"
      readonly middleware: Middleware<any, any, E, R>
    }
}

const Proto = {
  [HttpApiHandlersTypeId]: {
    _Endpoints: identity
  },
  pipe() {
    return pipeArguments(this, arguments)
  }
}

/**
 * @internal
 */
/**
 * @since 1.0.0
 */
export const makeHandlers = <
  E,
  R,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any
>(options: {
  readonly group: HttpApiGroup.HttpApiGroup<
    any,
    HttpApiEndpoint.HttpApiEndpoint.Any,
    any,
    R
  >
  readonly handlers: Chunk.Chunk<HttpApiHandlers.Item<E, R>>
}): HttpApiHandlers<E, R, Endpoints> => {
  const self = Object.create(Proto)
  self.group = options.group
  self.handlers = options.handlers
  return self
}

/**
 * @internal
 */
/**
 * @since 1.0.0
 */
export const makeHandler = <
  Endpoint extends HttpApiEndpoint.HttpApiEndpoint.Any,
  E,
  R
>(
  endpoint: Endpoint,
  handler: HttpApiEndpoint.HttpApiEndpoint.Handler<Endpoint, E, R>,
  options?: {
    readonly withFullResponse?: boolean
  }
): HttpApiHandlers.Item<E, R> => {
  return {
    _tag: "Handler",
    endpoint,
    handler,
    withFullResponse: options?.withFullResponse === true
  }
}

/**
 * @internal
 */
/**
 * @since 1.0.0
 */
export const makeMiddleware = <E, R>(
  middleware: HttpApiHandlers.Middleware<any, any, E, R>
): HttpApiHandlers.Item<E, R> => {
  return {
    _tag: "Middleware",
    middleware
  }
}
