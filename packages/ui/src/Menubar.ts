/**
 * Menubar is a persistent horizontal composite. Its root establishes DOM-order roving focus and
 * typeahead; items expose menuitem semantics and invoke caller-provided activation Effects.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [Menubar guide](/explore/ui-menubar).
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
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * The active top-level command and horizontal navigation policy.
 * Child menu visibility belongs to the separate Menu state connected by its submenu trigger.
 *
 * @since 1.0.0
 * @category Command focus
 */
export interface State extends Composite.State {}
/**
 * Initial Menubar values. Uses Composite defaults unless overridden.
 *
 * @since 1.0.0
 * @category Command focus
 */
export type InitialState = Composite.InitialState;
/**
 * Effect Schema used by makeState to encode, decode, and hydrate Menubar state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Menubar from "@typed/ui/Menubar";
 *
 * const decodeState = Schema.decodeUnknownEffect(Menubar.StateSchema);
 * ```
 * @since 1.0.0
 * @category Command focus
 */
export const StateSchema = Composite.StateSchema;

/**
 * Creates hydrated Menubar state. Uses Composite defaults unless overridden.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Menubar from "@typed/ui/Menubar";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Menubar.makeState({});
 *     const collection = yield* Menubar.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Command focus
 */
export function makeState(initial: InitialState = {}) {
  return Composite.makeState({ ...initial, orientation: initial.orientation ?? "horizontal" });
}

/**
 * Creates a scoped Collection for Menubar items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Menubar from "@typed/ui/Menubar";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Menubar.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Command registration
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Inputs accepted by Menubar.Root in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Menubar surface
 */
export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
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
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label?: Renderable.Any<string | null | undefined>;
}

function rootProps<const Options extends RootOptions>(options: Options) {
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          if ((yield* options.state).activeId !== null) return;
          yield* Composite.moveAndFocus(
            {
              state: options.state,
              collection: options.collection!,
              includeDisabled: true,
            },
            "first",
          );
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
              const activeId = (yield* options.state).activeId;
              const item =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((item) => item.id === activeId);
              const shouldActivate = event.key !== "ArrowDown" || item?.submenu === true;
              const element = shouldActivate && item?.disabled !== true ? item?.element : undefined;
              const click = element === undefined ? undefined : Reflect.get(element, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(element));
                return;
              }
            }
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction !== undefined) {
              event.preventDefault();
              yield* Composite.moveAndFocus(
                { state: options.state, collection: options.collection!, includeDisabled: true },
                direction,
              );
              return;
            }
            const key = Composite.typeaheadKey(event);
            if (key === null) return;
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const activeId = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
              undefined,
              true,
            );
            if (activeId === null) return;
            event.preventDefault();
            yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
            yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "menubar",
      "aria-label": property("label", undefined),
      "aria-orientation": RefSubject.map(options.state, (state) => state.orientation),
      tabindex: Composite.rootTabIndex(options.state),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootProps<Options>>>;

/**
 * Renders the persistent menubar root with roving focus, orientation-aware keys, and typeahead.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Menubar surface
 */
export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootProps<Options>>,
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
    RootProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Consumer-facing alias of the canonical Menubar component with identical behavior and lifetime.
 *
 * @remarks
 * The alias acquires nothing. Rendering it has exactly the canonical component's Scope and DOM
 * ownership contract.
 *
 * @since 1.0.0
 * @category Menubar surface
 */
export const Menubar = Root;

/**
 * Inputs accepted by Menubar.Item in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Top-level commands
 */
export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
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
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Search text used by typeahead independently of rendered markup.
   * @since 1.0.0
   * @category Text matching
   */
  readonly textValue?: string;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
  const activate =
    options.disabled === true
      ? Effect.void
      : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
  const focus = RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.textValue ?? options.id,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      role: "menuitem",
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onfocus: focus,
      onclick: activate,
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

/**
 * Renders a registered menuitem and runs onActivate for native focus or click unless disabled.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Top-level commands
 */
export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ItemProps<Options>>,
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
    ItemProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    itemProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
