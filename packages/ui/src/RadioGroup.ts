/**
 * Native radio selection with optional registered keyboard movement.
 * Choice values, element IDs, and shared native names have distinct responsibilities.
 *
 * Read the [RadioGroup guide](/explore/ui-radio-group) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
 * @since 1.0.0
 * @category Overview
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
 * Selected choice plus the active element used for keyboard movement.
 *
 * @remarks
 * value need not equal activeId. Orientation is vertical, virtualFocus is false, and the native
 * inputs retain their own browser grouping by name.
 * @since 1.0.0
 * @category State models
 */
export interface State extends Omit<Composite.State, "orientation"> {
  /**
   * Axis used to interpret Arrow-key movement.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation: "vertical";
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category Value state
   */
  readonly value: string;
}

/**
 * Required selected value with optional initial active ID and wrap policy.
 *
 * @remarks
 * activeId defaults to null; loop defaults to true. Supply an element ID only when the initial
 * active choice is known.
 * @since 1.0.0
 * @category State models
 */
export interface InitialState {
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category Value state
   */
  readonly value: string;
  /**
   * Id currently active for keyboard navigation; null means no active item.
   * @since 1.0.0
   * @category Keyboard focus
   */
  readonly activeId?: string | null;
  /**
   * Whether movement wraps between the first and last enabled items.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly loop?: boolean;
}

/**
 * Effect Schema used by makeState to encode, decode, and hydrate RadioGroup state.
 *
 * @remarks
 * A public schema makes hydration and serialized state use the same runtime validation as direct
 * construction.
 *
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const decodeState = Schema.decodeUnknownEffect(RadioGroup.StateSchema);
 * ```
 * @since 1.0.0
 * @category Hydration schemas
 */
export const StateSchema = Schema.Struct({
  value: Schema.String,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated radio selection with a required value, null active ID, and looping enabled by
 * default.
 *
 * @remarks
 * The selected value and element ID are separate. The first keyboard movement can resolve the
 * selected value against the mounted collection. Creation requires Scope; renderers borrow the
 * returned subject.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* RadioGroup.makeState({ value: "email" });
 *     const collection = yield* RadioGroup.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    value: initial.value,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for RadioGroup items.
 *
 * @remarks
 * State and collection ownership can be composed and tested independently from any renderer.
 *
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* RadioGroup.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category State construction
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Sets the selected value and optionally the active element ID.
 *
 * @remarks
 * Omitting activeId preserves the previous active ID. This state update does not look up an
 * item, move DOM focus, or verify that the value belongs to the group.
 * @since 1.0.0
 * @category State transitions
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: string,
  activeId?: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value,
    activeId: activeId ?? current.activeId,
  }));
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = yield* collection;
    const activeId =
      current.activeId ?? items.find((item) => item.value === current.value)?.id ?? null;
    const nextId = Composite.moveActiveId(items, { ...current, activeId }, direction);
    const item = nextId === null ? undefined : items.find((item) => item.id === nextId);
    if (item?.value === undefined) return current;
    const next = yield* setValue(state, item.value, item.id);
    yield* Composite.focusActive({ state, collection });
    return next;
  });
}

/**
 * State, optional navigation collection, child content, and group name.
 *
 * @remarks
 * Share the same collection with Item to enable registered keyboard movement. label names the
 * group; each item still needs its own label.
 * @since 1.0.0
 * @category Component options
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

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction === undefined) return;
            event.preventDefault();
            yield* move(options.state, options.collection!, direction);
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "radiogroup",
      "aria-label": property("label", undefined),
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

/**
 * Renders a named radiogroup around native radio items.
 *
 * @remarks
 * Pass the same state to every item and the same native name to items in one group. With a
 * collection, the root handles vertical arrow movement and Home/End, skips disabled
 * registrations, updates selection, and moves real focus. Without a collection, native input
 * behavior remains the keyboard boundary.
 *
 * @example
 * ```ts
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as RadioGroup from "@typed/ui/RadioGroup";
 *
 * export const DeliveryChoice = component(function* () {
 *   const state = yield* RadioGroup.makeState({ value: "standard" });
 *   const collection = yield* RadioGroup.makeCollection();
 *   return RadioGroup.Root({
 *     state,
 *     collection,
 *     label: "Delivery speed",
 *     content: html`
 *       <label>${RadioGroup.Item({
 *         state, collection, id: "delivery-standard", name: "delivery", value: "standard",
 *       })} Standard delivery</label>
 *       <label>${RadioGroup.Item({
 *         state, collection, id: "delivery-express", name: "delivery", value: "express",
 *       })} Express delivery</label>
 *     `,
 *   });
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
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
 * One native choice with stable element ID, application value, and native group name.
 *
 * @remarks
 * Use the same state and name across one radio group, unique IDs across the document, and distinct
 * values across choices. disabled is a boolean used by both rendering and registration.
 * @since 1.0.0
 * @category Component options
 */
export interface ItemOptions extends Dom.HostOptions<HTMLInputElement> {
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
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category Value state
   */
  readonly value: string;
  /**
   * Native radio-group form name shared by related input items.
   * @since 1.0.0
   * @category Native form data
   */
  readonly name?: string;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
}

function itemInternalProps<const Options extends ItemOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.value === options.value);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.value,
          textValue: options.value,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      type: "radio",
      role: "radio",
      name: options.name,
      value: options.value,
      "?disabled": options.disabled ?? false,
      "aria-checked": checked,
      "aria-disabled": options.disabled ?? false,
      "?checked": checked,
      ".checked": checked,
      onchange:
        options.disabled === true
          ? Effect.void
          : setValue(options.state, options.value, options.id),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemInternalProps<Options extends ItemOptions> = ReturnType<
  ReturnType<typeof itemInternalProps<Options>>
>;

/**
 * Renders one native radio input and optionally registers it for group navigation.
 *
 * @remarks
 * id identifies the element; value identifies the choice; name establishes the native browser
 * group. A native change updates the selected value and active ID. Supply a wrapping label or an
 * external label linked to id. Registration ends with the rendered Scope.
 * @since 1.0.0
 * @category Native controls
 */
export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, ItemInternalProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    ItemInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, itemInternalProps(options), "", (props) => html`<input ...${props} />`);
}

/**
 * Alias of Root.
 *
 * @remarks
 * The alias exposes the same native-input grouping and optional collection behavior; it introduces
 * no additional state or focus policy.
 * @since 1.0.0
 * @category Native controls
 */
export const RadioGroup = Root;
