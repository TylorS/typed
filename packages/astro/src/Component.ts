import type * as Effect from "effect/Effect";
import { pipeArguments } from "effect/Pipeable";
import { component as uiComponent } from "@typed/ui/Component";
import * as Fx from "@typed/fx/Fx";
import { html, type Renderable } from "@typed/template";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { Scope } from "effect/Scope";
import type { RenderTemplate } from "@typed/template/RenderTemplate";

const TypeId = Symbol.for("@typed/astro/Component");
/**
 * Named Astro slots available to a component generator's second argument.
 *
 * Astro owns the serialized or existing slot content. Insert each present slot
 * once as opaque output; a missing named slot is undefined. Re-rendering its
 * descendants with Typed would give two renderers ownership of the same range.
 *
 * @since 1.0.0
 * @category Astro slots
 */
export type Slots = Readonly<Record<string, Fx.Fx<RenderEvent> | undefined>>;
/**
 * Rendering services supplied by Astro for each server request or browser island.
 * Application services remain visible in the component's requirements and must
 * be provided by the component's pipeline or application boundary.
 *
 * @since 1.0.0
 * @category Island services
 */
export type Services = Scope | RenderTemplate;

type ComponentFx<Yield extends Effect.Effect<any, any, any>, Result extends Renderable.Any> = Fx.Fx<
  RenderEvent,
  Effect.Error<Yield> | Renderable.Error<Result>,
  Effect.Services<Yield> | Renderable.Services<Result> | Services
>;
type AstroValue<Result> =
  Result extends Fx.Fx<any, any, any>
    ? Result & {
        (_props?: {}, _slots?: Slots): Result;
        readonly [TypeId]: true;
      }
    : Result;
type ComponentResult<Args extends ReadonlyArray<any>, Result> = Args extends readonly []
  ? AstroValue<Result>
  : (...args: Args) => Result;

/**
 * Generator and argument-aware pipeline contracts for Astro components.
 *
 * @since 1.0.0
 * @category Generator contracts
 */
export namespace component {
  // Keep these overloads aligned with @typed/ui/Component so Astro preserves the same pipeline inference.
  /**
   * Overloads preserving generator arguments, yielded errors and services, and
   * the returned renderable's errors and services before optional pipelines.
   *
   * @since 1.0.0
   * @category Generator contracts
   */
  export type Gen = {
    /**
     * Creates a component directly for a zero-argument body.
     *
     * @since 1.0.0
     * @category Zero-argument components
     */
    <Yield extends Effect.Effect<any, any, any>, const Result extends Renderable.Any>(
      body: () => Generator<Yield, Result, any>,
    ): AstroValue<ComponentFx<Yield, Result>>;

    /**
     * Creates a component function while preserving the generator's parameters.
     *
     * @since 1.0.0
     * @category Parameterized components
     */
    <
      Args extends readonly [any, ...ReadonlyArray<any>],
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
    ): (...args: Args) => ComponentFx<Yield, Result>;

    /**
     * Applies one argument-aware transformation to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
    ): ComponentResult<Args, A>;

    /**
     * Applies two ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies three ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies four ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies five ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies six ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies seven ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies eight ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies nine ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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

    /**
     * Applies ten ordered argument-aware transformations to the generated Fx.
     *
     * @since 1.0.0
     * @category Argument-aware pipelines
     */
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
 * Defines a Typed Astro island with the generator and pipeline semantics of
 * @typed/ui/Component. Zero-argument generators produce lazy, callable Fx values
 * accepted by Astro markup; calling one returns its Fx without running it.
 * Parameterized generators produce functions. Each generator may return any
 * Renderable, normalized to RenderEvents under Astro's hydration boundary.
 * Pipes receive that Fx and the original arguments. Provide application services
 * in a pipe; Astro supplies Scope and RenderTemplate. Each run owns its state.
 * A zero-argument pipeline must retain an object value so it can carry the brand.
 *
 * @example
 * ```ts
 * import { component } from "@typed/astro/Component"
 * import { RefSubject } from "@typed/fx"
 * import { html } from "@typed/template"
 *
 * export const Quantity = component(function* ({ initial }: { initial: number }) {
 *   const quantity = yield* RefSubject.make(initial)
 *   return html`<output>${quantity}</output>`
 * })
 * ```
 *
 * @since 1.0.0
 * @category Island components
 */
export const component: component.Gen = (
  body: (
    ...args: ReadonlyArray<any>
  ) => Generator<Effect.Effect<any, any, any>, Renderable.Any, any>,
  ...pipes: ReadonlyArray<Function>
): any => {
  const normalized = function* (...args: ReadonlyArray<any>) {
    return html`${yield* body(...args)}`;
  };
  // Fx.fn selects by generator arity, so the parameterized wrapper must retain it.
  Object.defineProperty(normalized, "length", { value: body.length });
  const result = (uiComponent as (...args: ReadonlyArray<any>) => any)(normalized, ...pipes);
  if ((typeof result !== "object" || result === null) && typeof result !== "function") {
    throw new TypeError("An Astro component pipeline must produce a Renderable object or function");
  }
  if (body.length === 0 && Fx.isFx(result)) {
    // Astro's JSX checker requires a callable component. Preserve the Fx protocol
    // on that callable; neither calling it nor using run/pipe evaluates the body.
    const callable = Object.assign(() => result, result, {
      [Fx.FxTypeId]: result[Fx.FxTypeId],
      run: result.run.bind(result),
      pipe() {
        return pipeArguments(this, arguments);
      },
      [TypeId]: true as const,
    });
    return callable;
  }
  return Object.assign(result, { [TypeId]: true as const });
};

/**
 * Checks the Astro component brand without executing a candidate component.
 * Used by renderer discovery so probing does not run another framework's setup.
 *
 * @since 1.0.0
 * @category Renderer discovery
 */
export function isComponent(
  value: unknown,
): value is
  | Fx.Fx<RenderEvent, unknown, Services>
  | ((props: Record<string, unknown>, slots: Slots) => Fx.Fx<RenderEvent, unknown, Services>) {
  return (
    ((typeof value === "object" && value !== null) || typeof value === "function") &&
    TypeId in value &&
    value[TypeId] === true
  );
}

/**
 * Resolves Astro's props and slots call while leaving zero-argument Fx values lazy.
 * Renderer adapters use this after isComponent succeeds; application components
 * normally enter through Astro markup rather than calling this helper directly.
 *
 * @since 1.0.0
 * @category Renderer dispatch
 */
export function view(
  value:
    | Fx.Fx<RenderEvent, unknown, Services>
    | ((props: Record<string, unknown>, slots: Slots) => Fx.Fx<RenderEvent, unknown, Services>),
  props: Record<string, unknown>,
  slots: Slots,
): Fx.Fx<RenderEvent, unknown, Services> {
  return !Fx.isFx(value) && typeof value === "function" ? value(props, slots) : value;
}
