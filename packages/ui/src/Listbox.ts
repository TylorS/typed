/**
 * Listbox separates active and selected values, registers options in a Collection, and combines
 * vertical keyboard movement with buffered typeahead. It supports roving focus by default and uses
 * real focus, keydown, and click events.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * Learn the interaction in the [Listbox guide](/explore/ui-listbox).
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
 * The committed single value and the option currently owning keyboard focus.
 * Normal option focus and movement update both values; the DOM ID and saved value may differ.
 *
 * @since 1.0.0
 * @category Selection and focus
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
   * @category Current value
   */
  readonly value: string | null;
}
/**
 * Initial Listbox values. value and activeId default to null, loop defaults to true, and roving
 * focus is used.
 *
 * @since 1.0.0
 * @category Selection and focus
 */
export interface InitialState {
  /**
   * Current semantic value selected or edited by the widget.
   * @since 1.0.0
   * @category Current value
   */
  readonly value?: string | null;
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
 * Effect Schema used by makeState to encode, decode, and hydrate Listbox state.
 *
 * @remarks
 * @example
 * ```ts
 * import * as Schema from "effect/Schema";
 * import * as Listbox from "@typed/ui/Listbox";
 *
 * const decodeState = Schema.decodeUnknownEffect(Listbox.StateSchema);
 * ```
 * @since 1.0.0
 * @category Selection and focus
 */
export const StateSchema = Schema.Struct({
  value: Schema.NullOr(Schema.String),
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});
/**
 * Creates hydrated Listbox state. value and activeId default to null, loop defaults to true, and
 * roving focus is used.
 *
 * @remarks
 * The returned Effect creates the RefSubject when run. That state is renderer-independent;
 * collection registrations belong to the separate Scope that runs register or ref, not to state
 * creation.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Listbox from "@typed/ui/Listbox";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const state = yield* Listbox.makeState({});
 *     const collection = yield* Listbox.makeCollection();
 *     return { state: yield* state, collection: yield* collection };
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Selection and focus
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    value: initial.value ?? null,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}
/**
 * Creates a scoped Collection for Listbox items.
 *
 * @remarks
 * The returned Effect allocates the RefSubject in the caller's Scope. Each later registration is
 * owned by the Scope that runs register, independently of this construction Effect.
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect";
 * import * as Listbox from "@typed/ui/Listbox";
 *
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const collection = yield* Listbox.makeCollection();
 *     return yield* collection;
 *   }),
 * );
 * ```
 * @since 1.0.0
 * @category Option registration
 */
export const makeCollection = Collection.makeState<string>;
/**
 * Sets both activeId and selected value in one update.
 *
 * @remarks
 * The operation exposes Listbox's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Selection and focus
 */
export function select<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
  value: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId: id, value }));
}

/**
 * Moves through the registered options, synchronizes value when the target has one, then focuses
 * and scrolls the active option.
 *
 * @remarks
 * The operation exposes Listbox's transition directly so callers can compose it in Effect programs
 * and native event handlers.
 *
 * @since 1.0.0
 * @category Selection and focus
 */
export function move(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>>,
  direction: Composite.Move,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = yield* collection;
    const activeId = Composite.moveActiveId(items, current, direction);
    const item = activeId === null ? undefined : items.find((item) => item.id === activeId);
    const next = yield* RefSubject.update(state, (value) => ({
      ...value,
      activeId,
      value: item?.value ?? value.value,
    }));
    yield* Composite.focusActive({ state, collection });
    yield* Composite.scrollActive({ state, collection });
    return next;
  });
}

/**
 * Inputs accepted by Listbox.Root in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Listbox surface
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
          const current = yield* options.state;
          if (current.activeId !== null) return;
          const item = Composite.moveActiveItem(yield* options.collection!, current, "first");
          if (item?.value === undefined) return;
          yield* select(options.state, item.id, item.value);
          yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          yield* Composite.scrollActive({ state: options.state, collection: options.collection! });
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            const key = Composite.typeaheadKey(event);
            if (key !== null) {
              typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
              const id = Composite.typeaheadFrom(
                yield* options.collection!,
                typeahead.value,
                (yield* options.state).activeId,
              );
              if (id !== null) {
                event.preventDefault();
                const item = (yield* options.collection!).find((item) => item.id === id);
                if (item?.value !== undefined) yield* select(options.state, item.id, item.value);
                yield* Composite.focusActive({
                  state: options.state,
                  collection: options.collection!,
                });
              }
              return;
            }
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction !== undefined) {
              event.preventDefault();
              yield* move(options.state, options.collection!, direction);
            }
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "listbox",
      "aria-label": property("label", undefined),
      "aria-activedescendant": Composite.activeDescendant(options.state),
      tabindex: Composite.rootTabIndex(options.state),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootProps<Options>>>;
/**
 * Renders the listbox root, initializes selection on focus, and handles vertical movement and
 * typeahead in DOM order.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Listbox surface
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
 * Inputs accepted by Listbox.Option in addition to the shared DOM host options.
 *
 * @since 1.0.0
 * @category Selectable options
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
   * @category Current value
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
        options.disabled === true ? Effect.void : select(options.state, options.id, options.value),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type OptionProps<Options extends OptionOptions> = ReturnType<
  ReturnType<typeof optionProps<Options>>
>;
/**
 * Renders and optionally registers an option; focus or click selects it unless disabled.
 *
 * @remarks
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @since 1.0.0
 * @category Selectable options
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
