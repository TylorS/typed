import * as Effect from "effect/Effect";
import type { SpanOptionsNoTrace } from "effect/Tracer";
import type { unassigned } from "effect/Types";
import { unwrap } from "../combinators/unwrap.js";
import type { Fx } from "../Fx.js";
import { isFx } from "../TypeId.js";

/**
 * Callable contracts implemented by `fn`.
 *
 * @remarks
 * ## Why
 *
 * The namespace keeps generator and non-generator overload families addressable even
 * though one callable value implements both.
 *
 * ## Ownership and lifetime
 *
 * These are type-level contracts. They start no Effect or `Fx` run.
 *
 * @since 1.0.0
 * @category Generator composition
 */
export namespace fn {
  /**
   * Contract for functions whose body yields Effects and returns an `Fx`.
   *
   * @remarks
   * ## Why
   *
   * `Gen` combines services and errors from yielded Effects with those of the returned
   * `Fx`, while retaining the original arguments and `this` type. Optional pipeable
   * arguments transform the resulting `Fx` without hiding those channels.
   *
   * ## Ownership and lifetime
   *
   * Defining the function is inert. The body and yielded Effects execute once per run
   * of the `Fx` returned by an invocation; that run owns acquisition and interruption.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import { Fx } from "@typed/fx"
   *
   * const item = Fx.fn(function* (id: number) {
   *   const prefix = yield* Effect.succeed("item")
   *   return Fx.succeed(`${prefix}:${id}`)
   * })
   * const program = Fx.collectAll(item(1))
   * ```
   *
   * @since 1.0.0
   * @category Type contracts
   */
  export type Gen = {
    <Eff extends Effect.Effect<any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
    ): (
      ...args: Args
    ) => Fx<
      Fx.Success<ReturnFx>,
      Fx.Error<ReturnFx> | Effect.Error<Eff>,
      Fx.Services<ReturnFx> | Effect.Services<Eff>
    >;
    <
      Self,
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
    >(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
    ): (
      this: Self,
      ...args: Args
    ) => Fx<
      Fx.Success<ReturnFx>,
      Fx.Error<ReturnFx> | Effect.Error<Eff>,
      Fx.Services<ReturnFx> | Effect.Services<Eff>
    >;

    <Eff extends Effect.Effect<any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
    ): (...args: Args) => A;
    <
      Self,
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
    >(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
    ): (this: Self, ...args: Args) => A;

    <
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
      B,
    >(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
    ): (...args: Args) => B;
    <
      Self,
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
      B,
    >(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
    ): (this: Self, ...args: Args) => B;

    <
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
      B,
      C,
    >(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): (...args: Args) => C;
    <
      Self,
      Eff extends Effect.Effect<any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
      B,
      C,
    >(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | Effect.Error<Eff>,
          Fx.Services<ReturnFx> | Effect.Services<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): (this: Self, ...args: Args) => C;
  };

  /**
   * Contract for functions whose body returns an `Fx` directly.
   *
   * @remarks
   * ## Why
   *
   * `NonGen` adds Effect-style tracing and a typed pipeline to ordinary `Fx` factories
   * without forcing a generator when no Effect acquisition is needed.
   *
   * ## Ownership and lifetime
   *
   * Defining and invoking the function are both inert. Invocation returns an `Fx`
   * without evaluating `body`; `Effect.fn` suspends it. Each run evaluates the body
   * once, then runs its returned producer in that same ownership and interruption
   * lifetime.
   *
   * @example
   * ```ts
   * import { Fx } from "@typed/fx"
   *
   * let bodyCalls = 0
   * const greeting = Fx.fn(
   *   (name: string) => {
   *     bodyCalls += 1
   *     return Fx.succeed(name)
   *   },
   *   (source) => Fx.map(source, (name) => `hello ${name}`)
   * )
   * const source = greeting("Ada") // bodyCalls is still 0
   * const program = Fx.collectAll(source) // running program increments bodyCalls
   * ```
   *
   * @since 1.0.0
   * @category Type contracts
   */
  export type NonGen = {
    <Args extends Array<any>, ReturnFx extends Fx.Any>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
    ): (...args: Args) => ReturnFx;
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any>(
      body: (this: Self, ...args: Args) => ReturnFx,
    ): (this: Self, ...args: Args) => ReturnFx;

    <Args extends Array<any>, ReturnFx extends Fx.Any, A>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
    ): (...args: Args) => A;
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
    ): (this: Self, ...args: Args) => A;

    <Args extends Array<any>, ReturnFx extends Fx.Any, A, B>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
    ): (...args: Args) => B;
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A, B>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
    ): (this: Self, ...args: Args) => B;

    <Args extends Array<any>, ReturnFx extends Fx.Any, A, B, C>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): (...args: Args) => C;
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A, B, C>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): (this: Self, ...args: Args) => C;
  };
}

/**
 * Defines a traced function that returns an `Fx`, optionally after yielding Effects.
 *
 * @remarks
 * ## Why
 *
 * Producer factories frequently need Effect acquisition before returning an `Fx`.
 * `fn` lifts that generator into `Fx` with exact combined error and service channels;
 * direct-return bodies use the same tracing and pipeline surface. Supplying a name
 * delegates span configuration to Effect's `fn`.
 *
 * ## Ownership and lifetime
 *
 * Creating the function and invoking it start no stream. For generator bodies, each
 * run evaluates the body and yielded Effects, then runs the returned `Fx` in the same
 * structured lifetime. Interruption stops both acquisition and production. Direct
 * bodies are evaluated lazily through the same unwrap boundary.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const request = Fx.fn("request")(
 *   function* (id: number) {
 *     const token = yield* Effect.succeed("token")
 *     return Fx.succeed({ id, token })
 *   },
 *   (source) => Fx.map(source, ({ id }) => id)
 * )
 * const program = Fx.collectAll(request(42))
 * ```
 *
 * @since 1.0.0
 * @category Generator composition
 */
export const fn: fn.Gen &
  fn.NonGen & {
    (name: string, options?: SpanOptionsNoTrace): fn.Gen & fn.NonGen;
  } = function (...args: Array<any>): any {
  const [first, ...rest] = args;

  if (typeof first === "string") {
    const fn_ = Effect.fn(first, ...rest);
    return (body: any, ...pipeables: Array<Function>) =>
      fn_(
        unwrapApply(body),
        unwrap,
        // @ts-expect-error - It's fine to be variadic
        ...pipeables,
      );
  }

  return Effect.fn(
    unwrapApply(first),
    unwrap,
    // @ts-expect-error - It's fine to be variadic
    ...rest,
  );
};

function unwrapApply(fn: Function) {
  return function (this: any, ...args: Array<any>) {
    const x = fn.apply(this, args);
    if (isFx(x)) return Effect.succeed(x);
    return x;
  };
}
