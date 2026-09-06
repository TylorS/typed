/**
 * Carousel state keeps the active slide and rotation pause policy outside the renderer. Root
 * pauses rotation on focus and pointer entry; slides retain DOM identity while hidden; controls
 * use native button clicks.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [Carousel guide](/explore/ui-carousel).
 *
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * The visible slide identity and explicit paused flag.
 * Changing `paused` does not start a timer; an application scheduler must honor the flag.
 *
 * @since 1.0.0
 * @category Slide and rotation state
 */
export interface State {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId: string;
  /**
   * Whether automatic carousel rotation is suspended.
   * @since 1.0.0
   * @category Rotation policy
   */
  readonly paused: boolean;
}

/**
 * Initial Carousel values. activeId is required and paused defaults to true.
 *
 * @since 1.0.0
 * @category Slide and rotation state
 */
export interface InitialState {
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId: string;
  /**
   * Whether automatic carousel rotation is suspended.
   * @since 1.0.0
   * @category Rotation policy
   */
  readonly paused?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate Carousel state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Carousel from "@typed/ui/Carousel";
 *
 * const decodeState = Schema.decodeUnknownEffect(Carousel.StateSchema);
 * ```
 * @since 1.0.0
 * @category Slide and rotation state
 */
export const StateSchema = Schema.Struct({ activeId: Schema.String, paused: Schema.Boolean });

/**
 * Creates hydrated Carousel state. activeId is required and paused defaults to true.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Carousel from "@typed/ui/Carousel";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Carousel.makeState({ activeId: "slide-1" });
 *     const collection = yield* Carousel.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Slide and rotation state
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId,
    paused: initial.paused ?? true,
  });
}

/**
 * Creates a scoped Collection for Carousel items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Carousel from "@typed/ui/Carousel";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Carousel.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Slide registration
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Sets activeId without changing paused state.
 *
 * @remarks
 * The operation exposes Carousel's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Slide navigation
 */
export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

/**
 * Selects the previous or next enabled registered slide; movement wraps and leaves state unchanged
 * for an empty collection.
 *
 * @remarks
 * The operation exposes Carousel's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Slide navigation
 */
export function move<E, R, E2, R2>(
  state: RefSubject.RefSubject<State, E, R>,
  collection: RefSubject.RefSubject<Collection.State<string>, E2, R2>,
  direction: "next" | "previous",
): Effect.Effect<State, E | E2, R | R2> {
  return Effect.gen(function* () {
    const next = Composite.moveActiveId(
      yield* collection,
      { activeId: (yield* state).activeId, loop: true },
      direction,
    );
    return next === null ? yield* state : yield* select(state, next);
  });
}

/**
 * Flips paused and preserves activeId.
 *
 * @remarks
 * The operation exposes Carousel's transition directly so callers can compose it in Effect
 * programs and native event handlers.
 *
 * @since 1.0.0
 * @category Rotation policy
 */
export function toggleRotation<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, paused: !current.paused }));
}

/**
 * Inputs accepted by Carousel.Root in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Carousel region
 */
export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label: Renderable.Any<string | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const pause = RefSubject.update(options.state, (current) =>
    current.paused ? current : { ...current, paused: true },
  );
  let resumeOnPointerLeave = false;
  const pauseForFocus = Effect.andThen(
    Effect.sync(() => {
      resumeOnPointerLeave = false;
    }),
    pause,
  );
  const pauseForPointer = Effect.flatMap(options.state, (current) => {
    resumeOnPointerLeave = !current.paused;
    return pause;
  });
  const resumeAfterPointer = Effect.suspend(() => {
    if (!resumeOnPointerLeave) return Effect.void;
    resumeOnPointerLeave = false;
    return RefSubject.update(options.state, (current) =>
      current.paused ? { ...current, paused: false } : current,
    );
  });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "region",
      "aria-roledescription": "carousel",
      "aria-label": property("label", undefined),
      onfocusin: pauseForFocus,
      onmouseenter: pauseForPointer,
      onmouseleave: resumeAfterPointer,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders the carousel region and pauses automatic rotation on focus or pointer entry without
 * replacing its child nodes.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Carousel region
 */
export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RootInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Carousel.Slide in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Slide content
 */
export interface SlideOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Stable id used for collection identity and ARIA relationships.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label: Renderable.Any<string | null | undefined>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function slideInternalProps<const Options extends SlideOptions>(options: Options) {
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.id,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role: "group",
      "aria-roledescription": "slide",
      "aria-label": property("label", undefined),
      "?hidden": RefSubject.map(options.state, (state) => state.activeId !== options.id),
      ref: register,
    }) as const;
}
type SlideInternalProps<Options extends SlideOptions> = ReturnType<
  ReturnType<typeof slideInternalProps<Options>>
>;

/**
 * Renders one labelled slide, registers it when a collection is supplied, and toggles hidden from
 * activeId.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Slide content
 */
export function Slide<const Options extends SlideOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SlideInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    SlideInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, slideInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Inputs accepted by Carousel.Control in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Slide controls
 */
export interface ControlOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Renderer-independent RefSubject state consumed by this component or operation.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Item registry used for collection-driven keyboard behavior and mounted ordering.
   * @since 1.0.0
   * @category Item registration
   */
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function controlInternalProps<const Options extends ControlOptions>(
  options: Options,
  action: Effect.Effect<unknown, Schema.SchemaError>,
) {
  return () => ({ type: "button", onclick: action }) as const;
}

function control<const Options extends ControlOptions, const Host extends HostResult>(
  options: Options,
  host:
    | Dom.HostOverride<
        Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
        Options["content"],
        Host
      >
    | undefined,
  action: Effect.Effect<unknown, Schema.SchemaError>,
) {
  const internal = controlInternalProps(options, action);
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    ReturnType<typeof internal>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    internal,
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Renders a button whose native click selects the previous registered slide with wrapping enabled.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Slide controls
 */
export function Previous<
  const Options extends ControlOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(
    options,
    host,
    options.collection === undefined
      ? Effect.void
      : move(options.state, options.collection, "previous"),
  );
}

/**
 * Renders a button whose native click selects the next registered slide with wrapping enabled.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Slide controls
 */
export function Next<const Options extends ControlOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(
    options,
    host,
    options.collection === undefined
      ? Effect.void
      : move(options.state, options.collection, "next"),
  );
}

/**
 * Renders a button whose native click toggles the explicit paused state.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Rotation policy
 */
export function RotationControl<
  const Options extends Omit<ControlOptions, "collection">,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ReturnType<ReturnType<typeof controlInternalProps<Options>>>>,
    Options["content"],
    Host
  >,
) {
  return control(options, host, toggleRotation(options.state));
}
