/**
 * A native popover-backed listbox with separate selection, focus, and visibility.
 * Unlike Form.Select, these options are divs rather than native select options.
 * Pass one collection to Content and its Options for registered keyboard navigation.
 *
 * Read the [Select guide](/explore/ui-select) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
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
import * as NativePopover from "./NativePopover.js";

/**
 * Popup identity, committed value, visibility, and active option.
 *
 * @remarks
 * value and activeId are independent: keyboard movement can change activeId before selection
 * commits a value. Vertical real-focus navigation is fixed by makeState.
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
  readonly value: string | null;
  /**
   * Whether the associated native popover is open.
   * @since 1.0.0
   * @category Visibility
   */
  readonly open: boolean;
}

const invokers = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  globalThis.Element
>();

/**
 * Required popup ID with optional initial selection, visibility, focus, and wrap policy.
 *
 * @remarks
 * value and activeId default to null, open to false, and loop to true. Use a stable
 * document-unique ID so the native invoker relationship survives hydration.
 * @since 1.0.0
 * @category State models
 */
export interface InitialState {
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
  readonly value?: string | null;
  /**
   * Whether the associated native popover is open.
   * @since 1.0.0
   * @category Visibility
   */
  readonly open?: boolean;
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
 * Effect Schema used by makeState to encode, decode, and hydrate Select state.
 *
 * @remarks
 * A public schema makes hydration and serialized state use the same runtime validation as direct
 * construction.
 *
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Select from "@typed/ui/Select";
 *
 * const decodeState = Schema.decodeUnknownEffect(Select.StateSchema);
 * ```
 * @since 1.0.0
 * @category Hydration schemas
 */
export const StateSchema = Schema.Struct({
  id: Schema.String,
  value: Schema.NullOr(Schema.String),
  open: Schema.Boolean,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

/**
 * Creates hydrated Select state. The caller supplies id; value and activeId default null, open
 * false, and loop true.
 *
 * @remarks
 * State and collection ownership can be composed and tested independently from any renderer.
 *
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Select from "@typed/ui/Select";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Select.makeState({ id: "timezone" });
 *     const collection = yield* Select.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    id: initial.id,
    value: initial.value ?? null,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

/**
 * Creates a scoped Collection for Select items.
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
 * import * as Select from "@typed/ui/Select";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Select.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category State construction
 */
export const makeCollection = Collection.makeState<string>;

/**
 * Commits an option ID and value, then marks the popup closed.
 *
 * @remarks
 * This Effect changes state only. It does not check collection membership or move focus itself;
 * the mounted popover observes the visibility change. Keep id and value consistent with the
 * option being selected.
 * @since 1.0.0
 * @category State transitions
 */
export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
  value: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: id, value, open: false }));
}

function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Composite.moveAndFocus({ state, collection }, direction);
}

function selectActive(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const activeId = (yield* state).activeId;
    const item =
      activeId === null ? undefined : (yield* collection).find((item) => item.id === activeId);
    return item?.value === undefined ? yield* state : yield* select(state, item.id, item.value);
  });
}

/**
 * Shared select state and the button content that names the current choice.
 *
 * @remarks
 * The trigger derives its IDs and popover target from state.id. Content may be reactive; selecting
 * a value does not automatically replace the label.
 * @since 1.0.0
 * @category Component options
 */
export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
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
}

function triggerProps<const Options extends TriggerOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const triggerId = RefSubject.map(options.state, (state) => `${state.id}-trigger`);
  const open = RefSubject.map(options.state, (state) => state.open);
  return () =>
    ({
      id: triggerId,
      type: "button",
      popovertarget: id,
      popovertargetaction: "toggle",
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onkeydown: EventHandler.make((event: KeyboardEvent) => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        Dom.currentTarget<HTMLButtonElement>(event).click();
      }),
      ref: Dom.composeRefs(options.state, invokerRef(options.state)),
    }) as const;
}

function invokerRef(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
): (element: globalThis.Element) => Effect.Effect<void, never, Scope.Scope> {
  return Effect.fn(function* (element) {
    invokers.set(state, element);
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        if (invokers.get(state) === element) invokers.delete(state);
      }),
    );
  });
}
type TriggerProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerProps<Options>>
>;

/**
 * Renders the native button that toggles the select listbox popover.
 *
 * @remarks
 * The generated button ID labels Content; popovertarget points to state.id. ArrowDown invokes
 * the native button click. Content synchronizes native toggle events with open state. Render a
 * useful name containing the current choice; the trigger does not format selected values for
 * you.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as Select from "@typed/ui/Select";
 *
 * export const DensityPicker = component(function* () {
 *   const state = yield* Select.makeState({ id: "density-options", value: "comfortable" });
 *   const collection = yield* Select.makeCollection();
 *   const label = RefSubject.map(state, ({ value }) =>
 *     value === "compact" ? "Density: compact" : "Density: comfortable",
 *   );
 *   return html`<div class="density-picker">
 *     ${Select.Trigger({ state, content: label })}
 *     ${Select.Content({
 *       state, collection,
 *       content: [
 *         Select.Option({
 *           state, collection, id: "density-comfortable", value: "comfortable",
 *           textValue: "Comfortable", content: "Comfortable",
 *         }),
 *         Select.Option({
 *           state, collection, id: "density-compact", value: "compact",
 *           textValue: "Compact", content: "Compact",
 *         }),
 *       ],
 *     })}
 *   </div>`;
 * });
 * ```
 * @since 1.0.0
 * @category Controls
 */
export function Trigger<
  const Options extends TriggerOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TriggerProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    TriggerProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    triggerProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/**
 * Alias of Trigger.
 *
 * @remarks
 * Calling Select alone creates only the invoker button. Compose Content and Option for the popup
 * choice surface; use Form.Select for a native select element.
 * @since 1.0.0
 * @category Controls
 */
export const Select = Trigger;

/**
 * Shared state, registered option collection, and listbox content.
 *
 * @remarks
 * The collection is optional in the type but required for this host’s keyboard navigation and
 * selected-item focus on opening. Render the same registered options represented by that
 * collection.
 * @since 1.0.0
 * @category Component options
 */
export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
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

function contentProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const triggerId = RefSubject.map(options.state, (state) => `${state.id}-trigger`);
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  let restoreInvokerFocus = false;
  const restoreFocus = Effect.gen(function* () {
    if (!restoreInvokerFocus) return;
    restoreInvokerFocus = false;
    yield* Composite.focusElement(invokers.get(options.state));
  });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction !== undefined) {
              event.preventDefault();
              yield* move(options.state, options.collection!, direction);
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              yield* selectActive(options.state, options.collection!);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              restoreInvokerFocus = true;
              yield* setOpen(options.state, false);
              return;
            }
            const key = Composite.typeaheadKey(event);
            if (key === null) return;
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const activeId = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
            );
            if (activeId === null) return;
            event.preventDefault();
            yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
            yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          }),
        );
  return () =>
    ({
      id,
      role: "listbox",
      "aria-labelledby": triggerId,
      popover: "manual",
      "aria-activedescendant": Composite.activeDescendant(options.state),
      onkeydown,
      ontoggle: EventHandler.make(
        Effect.fn(function* (event: Event) {
          const open = Dom.toggleState(event) === "open";
          const current = yield* options.state;
          if (current.open === open) {
            if (!open) yield* restoreFocus;
            return current;
          }
          const next = yield* RefSubject.update(options.state, (state) => ({ ...state, open }));
          if (!open) {
            yield* restoreFocus;
            return next;
          }
          if (options.collection === undefined) return next;
          const item = (yield* options.collection).find((item) => item.value === next.value);
          if (item === undefined) return next;
          const selected = yield* RefSubject.update(options.state, (state) => ({
            ...state,
            activeId: item.id,
          }));
          yield* Composite.focusActive({ state: options.state, collection: options.collection });
          yield* Composite.scrollActive({ state: options.state, collection: options.collection });
          return selected;
        }),
      ),
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}
type ContentProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentProps<Options>>
>;

/**
 * Renders the manual-popover listbox and coordinates registered keyboard movement.
 *
 * @remarks
 * With a collection, arrows and Home/End move focus, buffered typeahead locates options,
 * Enter/Space commits the active choice, and Escape closes with invoker focus restoration.
 * Opening focuses a registered option matching the selected value; an unmatched or null value
 * does not choose the first option. Manual popover mode does not imply auto-mode outside-click
 * dismissal.
 * @since 1.0.0
 * @category Controls
 */
export function Content<
  const Options extends ContentOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentProps<Options>>,
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
    ContentProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/**
 * Stable option identity, selection value, rendered content, and optional typeahead text.
 *
 * @remarks
 * Share state and collection with Content. textValue should be the human-readable label when value
 * is an internal code; disabled suppresses activation and participates in navigation.
 * @since 1.0.0
 * @category Component options
 */
export interface OptionOptions extends Dom.HostOptions<HTMLDivElement> {
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
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /**
   * Search text used by typeahead independently of rendered markup.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly textValue?: string;
  /**
   * Flag used by collection movement and widget handlers to skip activation by default.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: boolean;
}

function optionProps<const Options extends OptionOptions>(options: Options) {
  const selected = RefSubject.map(options.state, (state) => state.value === options.value);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.value,
          textValue: options.textValue ?? options.value,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      role: "option",
      "aria-selected": selected,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick:
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
      onfocus:
        options.disabled === true
          ? Effect.void
          : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id })),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type OptionProps<Options extends OptionOptions> = ReturnType<
  ReturnType<typeof optionProps<Options>>
>;

/**
 * Renders a selectable listbox option with distinct active and selected state.
 *
 * @remarks
 * Click commits value and closes the popup; focus updates activeId without committing a new
 * value. Register every option with the same collection used by Content for keyboard navigation.
 * Supply textValue for readable typeahead when value is an internal code. This div is not a
 * native form field.
 * @since 1.0.0
 * @category Controls
 */
export function Option<const Options extends OptionOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, OptionProps<Options>>,
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
    OptionProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    optionProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}
