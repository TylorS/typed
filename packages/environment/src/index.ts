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
  | Environment.Value
  | `test:${Environment.Value}`

/**
 * @since 1.0.0
 */
export namespace Environment {
  /**
   * @since 1.0.0
   */
  export type Value =
    | "dom"
    | "server"
    | "serviceWorker"
    | "static"
    | "webWorker"
}

class EnvironmentValueImpl<T extends Environment.Value> extends String {
  readonly test: string
  constructor(value: T) {
    super(value)

    this.test = `test:${value}` as `test:${T}`
  }
}

/**
 * @since 1.0.0
 */
export type EnvironmentValue<T extends Environment.Value> = T & {
  readonly test: `test:${T}`
}

function EnvironmentValue<const T extends Environment.Value>(value: T): EnvironmentValue<T> {
  return new EnvironmentValueImpl(value) as any
}

/**
 * @since 1.0.0
 */
export const Environment = {
  dom: EnvironmentValue("dom"),
  server: EnvironmentValue("server"),
  serviceWorker: EnvironmentValue("serviceWorker"),
  static: EnvironmentValue("static"),
  webWorker: EnvironmentValue("webWorker")
} satisfies { readonly [_ in Environment.Value]: EnvironmentValue<_> }

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
export const isTest: Effect.Effect<boolean, never, CurrentEnvironment> = CurrentEnvironment.with((e) =>
  e.startsWith("test:")
)

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
