/**
 * Environment is a small abstraction over providing runtime information about the environment we are running within.
 * @since 1.0.0
 */
import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

/**
 * @since 1.0.0
 */
export type Environment =
  | "dom"
  | "server"
  | "serviceWorker"
  | "static"
  | "test"
  | "webWorker"

/**
 * @since 1.0.0
 */
export const Environment: { readonly [_ in Environment]: _ } = {
  dom: "dom",
  server: "server",
  serviceWorker: "serviceWorker",
  static: "static",
  test: "test",
  webWorker: "webWorker"
}

/**
 * @since 1.0.0
 */
export const CurrentEnvironment = Context.Tagged<Environment>()((
  _
) => (class CurrentEnvironment extends _("@typed/environment/CurrentEnvironment") {}))

/**
 * @since 1.0.0
 */
export type CurrentEnvironment = Context.Tag.Identifier<typeof CurrentEnvironment>

/**
 * @since 1.0.0
 */
export const isDom: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) => e === "dom")

/**
 * @since 1.0.0
 */
export const isServer: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) =>
  e === "server"
)

/**
 * @since 1.0.0
 */
export const isStatic: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) =>
  e === "static"
)

/**
 * @since 1.0.0
 */
export const isTest: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) => e === "test")

/**
 * @since 1.0.0
 */
export const isServiceWorker: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) =>
  e === "serviceWorker"
)

/**
 * @since 1.0.0
 */
export const isWebWorker: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) =>
  e === "webWorker"
)
