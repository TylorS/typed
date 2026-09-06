import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { liftRenderableToFx, type Renderable } from "@typed/template";

type ComponentFx<Yield extends Effect.Effect<any, any, any>, Result extends Renderable.Any> = [
  Fx.Fx<
    Renderable.Success<Result>,
    Effect.Error<Yield> | Renderable.Error<Result>,
    Effect.Services<Yield> | Renderable.Services<Result> | Scope.Scope
  >,
] extends [Fx.Fx<infer Success, infer Error, infer Services>]
  ? Fx.Fx<Success, Error, Services>
  : never;

type ComponentResult<Args extends ReadonlyArray<any>, Result> = Args extends readonly []
  ? Result
  : (...args: Args) => Result;

/**
 * Type-level contracts used by the `component` constructor.
 *
 * @remarks
 * ## Why
 *
 * The namespace keeps the overload-rich generator contract attached to the
 * callable constructor while still making it available to library authors who
 * wrap `component`.
 *
 * ## Ownership and lifetime
 *
 * These types acquire nothing. The `Fx` produced by `component` is lazy;
 * each run forks its parent `Scope` for yielded effects, subscriptions, and cleanup.
 *
 * @since 1.0.0
 * @category Component construction
 */
export namespace component {
  /**
   * The overloaded callable type of `component`.
   *
   * @remarks
   * ## Why
   *
   * `Gen` preserves argument, error, and service inference across generator
   * components and optional post-construction pipe functions. A zero-argument
   * body returns an `Fx`; a body with arguments returns a component function.
   *
   * ## Ownership and lifetime
   *
   * Calling a `Gen` value constructs a lazy `Fx` and starts no work. Resources
   * yielded by the generator belong to a child forked from the running Fx's
   * required parent Scope. The returned renderable shares that same child.
   *
   * @example
   * ```ts
   * import { component } from "@typed/ui/Component"
   * import { html } from "@typed/template"
   *
   * const define: component.Gen = component
   * const Greeting = define(function* (name: string) {
   *   return html`<p>Hello ${name}</p>`
   * })
   * ```
   *
   * @since 1.0.0
   * @category Generator overloads
   */
  export type Gen = {
    /** Creates a component directly for a zero-argument body. @since 1.0.0 @category Zero-argument components */
    <Yield extends Effect.Effect<any, any, any>, const Result extends Renderable.Any>(
      body: () => Generator<Yield, Result, any>,
    ): ComponentFx<Yield, Result>;

    /** Creates a component function while preserving the generator's parameters. @since 1.0.0 @category Parameterized components */
    <
      Args extends readonly [any, ...ReadonlyArray<any>],
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
    ): (...args: Args) => ComponentFx<Yield, Result>;

    /** Applies one argument-aware transformation to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
    ): ComponentResult<Args, A>;

    /** Applies two ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
    ): ComponentResult<Args, B>;

    /** Applies three ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): ComponentResult<Args, C>;

    /** Applies four ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
    ): ComponentResult<Args, D>;

    /** Applies five ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
    ): ComponentResult<Args, E>;

    /** Applies six ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
    ): ComponentResult<Args, F>;

    /** Applies seven ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
    ): ComponentResult<Args, G>;

    /** Applies eight ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
    ): ComponentResult<Args, H>;

    /** Applies nine ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
      i: (_: H, ...args: Args) => I,
    ): ComponentResult<Args, I>;

    /** Applies ten ordered argument-aware transformations to the generated Fx. @since 1.0.0 @category Argument-aware pipelines */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
      J,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
      i: (_: H, ...args: Args) => I,
      j: (_: I, ...args: Args) => J,
    ): ComponentResult<Args, J>;
  };
}

/**
 * Creates an Fx component from a generator that may return any Renderable. A
 * zero-arity generator creates an Fx directly; generators with parameters
 * create an Fx function. Additional functions are piped over the generated Fx
 * using the same argument-forwarding behavior as Fx.fn.
 *
 * @remarks
 * ## Why
 *
 * Components often need Effect services before they can return a template,
 * DOM node, render event, or other `Renderable`. This constructor turns that
 * generator into a single `Fx<RenderEvent, E, R>` boundary without introducing
 * a component tree or a second runtime beside Effect.
 *
 * ## Ownership and lifetime
 *
 * Construction is lazy. Each run forks the required parent Scope and provides
 * that child to both yielded effects and the lifted returned renderable. The
 * child stays open throughout subscription and closes on completion, failure,
 * or interruption; closing the parent also closes every child. Sibling runs
 * therefore own separate resources. A DOM template stays subscribed after its
 * first emission, so its child remains open while the template is mounted.
 * Even a scalar component requires Scope. The constructor does not own DOM
 * outside its returned renderable.
 *
 * ## Composition
 *
 * A parameterless generator returns an Fx directly. A generator with
 * parameters returns a function, and optional pipe functions receive the
 * generated Fx followed by the original arguments, matching `Fx.fn`.
 *
 * @example
 * ```ts
 * import { component } from "@typed/ui/Component"
 * import { html } from "@typed/template"
 * import { Effect } from "effect"
 *
 * const Greeting = component(function* (name: string) {
 *   const greeting = yield* Effect.succeed("Hello")
 *   return html`<p>${greeting} ${name}</p>`
 * })
 * ```
 *
 * @since 1.0.0
 * @category Component construction
 */
export const component: component.Gen = function (
  body: (
    ...args: ReadonlyArray<any>
  ) => Generator<Effect.Effect<any, any, any>, Renderable.Any, any>,
  ...pipeables: ReadonlyArray<Function>
): any {
  if (body.length === 0) {
    let result: any = instance(() => body());

    for (const pipeable of pipeables) {
      result = pipeable(result);
    }

    return result;
  }

  return (Fx.fn as (...args: ReadonlyArray<any>) => any)(
    // Fx.fn needs a generator; instance owns acquisition inside the child Scope.
    // oxlint-disable-next-line require-yield
    function* (...args: ReadonlyArray<any>) {
      return instance(() => body(...args));
    },
    ...pipeables,
  );
};

function instance(
  body: () => Generator<Effect.Effect<any, any, any>, Renderable.Any, any>,
): Fx.Fx<any, any, any> {
  return Fx.make((sink) =>
    Effect.flatMap(Scope.Scope, (parent) =>
      Effect.acquireUseRelease(
        Scope.fork(parent),
        (child) =>
          Scope.provide(
            Fx.gen(function* () {
              const renderable = yield* body();
              return liftRenderableToFx(renderable);
            }).run(sink),
            child,
          ),
        (child, exit) => Scope.close(child, exit),
      ),
    ),
  );
}
