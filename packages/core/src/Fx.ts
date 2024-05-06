/**
 * Re-exports from @typed/fx/Fx
 * @since 1.0.0
 */

import { CurrentEnvironment, type Environment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as Effect from "effect/Effect"

/**
 * [Fx documentation](https://tylors.github.io/typed/fx/Fx.ts.html)
 * @since 1.0.0
 */
export * from "@typed/fx/Fx"

/**
 * @since 1.0.0
 */
export const takeOneIfEnvironment: {
  (environments: ReadonlyArray<Environment>): <A, E, R>(
    fx: Fx.Fx<A, E, R>
  ) => Fx.Fx<A, E, R | CurrentEnvironment>

  <A, E, R>(
    fx: Fx.Fx<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): Fx.Fx<A, E, R | CurrentEnvironment>
} = function takeOneIfEnvironment<A, E, R>(
  ...args: [ReadonlyArray<Environment>] | [Fx.Fx<A, E, R>, ReadonlyArray<Environment>]
): any {
  if (args.length === 1) {
    return (fx: Fx.Fx<A, E, R>) => takeOneIfEnvironment(fx, args[0])
  }

  const [fx, environments] = args
  return CurrentEnvironment.pipe(Effect.map((env) => environments.includes(env) ? Fx.take(fx, 1) : fx), Fx.fromFxEffect)
}

/**
 * @since 1.0.0
 */
export const takeOneIfNotEnvironment: {
  (environments: ReadonlyArray<Environment>): <A, E, R>(
    fx: Fx.Fx<A, E, R>
  ) => Fx.Fx<A, E, R | CurrentEnvironment>

  <A, E, R>(
    fx: Fx.Fx<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): Fx.Fx<A, E, R | CurrentEnvironment>
} = function takeOneIfNotEnvironment<A, E, R>(
  ...args: [ReadonlyArray<Environment>] | [Fx.Fx<A, E, R>, ReadonlyArray<Environment>]
): any {
  if (args.length === 1) {
    return (fx: Fx.Fx<A, E, R>) => takeOneIfNotEnvironment(fx, args[0])
  }

  const [fx, environments] = args
  return CurrentEnvironment.pipe(
    Effect.map((env) => !environments.includes(env) ? Fx.take(fx, 1) : fx),
    Fx.fromFxEffect
  )
}

/**
 * @since 1.0.0
 */
export const takeOneIfNotDomEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, R | CurrentEnvironment> =
  takeOneIfNotEnvironment(["dom", "test:dom"])

/**
 * @since 1.0.0
 */
export const takeOneIfDomEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, CurrentEnvironment | R> =
  takeOneIfEnvironment(["dom", "test:dom"])

/**
 * @since 1.0.0
 */
export const takeOneIfNotServerEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, CurrentEnvironment | R> =
  takeOneIfNotEnvironment(["server", "test:server"])

/**
 * @since 1.0.0
 */
export const takeOneIfServerEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, CurrentEnvironment | R> =
  takeOneIfEnvironment(["server", "test:server"])

/**
 * @since 1.0.0
 */
export const takeOneIfNotStaticEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, CurrentEnvironment | R> =
  takeOneIfNotEnvironment(["static", "test:static"])

/**
 * @since 1.0.0
 */
export const takeOneIfStaticEnvironment: <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E, CurrentEnvironment | R> =
  takeOneIfEnvironment(["static", "test:static"])
