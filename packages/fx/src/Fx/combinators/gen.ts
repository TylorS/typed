import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { unwrap } from "./unwrap.js";

/**
 * Builds an Fx by yielding Effects and returning the Fx to run afterward.
 *
 * @remarks
 * ## Why
 *
 * Setup logic often needs Effect services or failures before it can choose a
 * push producer. Generator notation keeps that dependency-aware setup linear
 * while preserving the returned Fx's success, error, and service channels.
 *
 * ## Ownership and lifetime
 *
 * The generator is lazy: it runs for each subscription. Yielded Effects run
 * first; only their returned Fx is then subscribed. A setup failure prevents
 * the Fx from starting, and interruption cancels the active phase. Resources
 * acquired by yielded Effects must not escape unless managed independently;
 * use {@link genScoped} when setup and the returned Fx share a Scope.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { gen } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const greeting = gen(function* () {
 *   const name = yield* Effect.succeed("Typed")
 *   return succeed(`Hello, ${name}`)
 * })
 * ```
 *
 * @param f - The generator function.
 * @returns An `Fx` representing the result of the generator.
 * @since 1.0.0
 * @category Generator composition
 */
export const gen = <Yield extends Effect.Effect<any, any, any>, Return extends Fx.Any>(
  f: () => Generator<Yield, Return, any>,
): Fx<
  Fx.Success<Return>,
  Fx.Error<Return> | ([Yield] extends [never] ? never : Effect.Error<Yield>),
  Fx.Services<Return> | ([Yield] extends [never] ? never : Effect.Services<Yield>)
> => unwrap(Effect.gen(f));
