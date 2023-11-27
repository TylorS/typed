/**
 * Environment is a small abstraction over providing runtime information about the environment we are running within.
 * @since 1.0.0
 */
import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

/**
 * @since 1.0.0
 */
export type Environment = "browser" | "server" | "static" | "test"

/**
 * @since 1.0.0
 */
export const Environment: { readonly [_ in Environment]: _ } = {
  server: "server",
  browser: "browser",
  static: "static",
  test: "test"
}

/**
 * @since 1.0.0
 */
export const CurrentEnvironment = Context.Tagged<Environment>()((_) =>
  class CurrentEnvironment extends _("@typed/environment/CurrentEnvironment") {}
)

/**
 * @since 1.0.0
 */
export type CurrentEnvironment = Context.Tag.Identifier<typeof CurrentEnvironment>

/**
 * @since 1.0.0
 */
export const isBrowser: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "browser"
)

/**
 * @since 1.0.0
 */
export const isServer: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "server"
)

/**
 * @since 1.0.0
 */
export const isStatic: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "static"
)

/**
 * @since 1.0.0
 */
export const isTest: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) => e === "test")
