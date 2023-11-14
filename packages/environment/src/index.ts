import * as Context from "@typed/context"
import type * as Effect from "effect/Effect"

export type Environment = "browser" | "server" | "static"

/**
 * @since 1.0.0
 */
export const Environment: { readonly [_ in Environment]: _ } = {
  server: "server",
  browser: "browser",
  static: "static"
}

export const CurrentEnvironment = Context.Tagged<Environment>()((_) =>
  class CurrentEnvironment extends _("@typed/environment/CurrentEnvironment") {}
)

export type CurrentEnvironment = Context.Tag.Identifier<typeof CurrentEnvironment>

export const isBrowser: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "browser"
)

export const isServer: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "server"
)

export const isStatic: Effect.Effect<CurrentEnvironment, never, boolean> = CurrentEnvironment.with((e) =>
  e === "static"
)
