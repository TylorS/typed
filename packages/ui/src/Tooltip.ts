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
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativePopover from "./NativePopover.js";

/** Current tooltip identity and visibility.
 * @remarks
 * ## Why
 * A stable id connects the anchor's description relationship to native popover
 * content while open state stays renderer-independent.
 * ## Ownership and lifetime
 * Plain state retains no resources; RefSubject observation is Scope-owned.
 * @since 1.0.0
 * @category Open state
 */
export interface State {
  /** Stable id used by `aria-describedby` and tooltip content.
   * @remarks
   * ## Why
   * Server and client must agree on the relationship target during hydration.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /** Whether tooltip content is open.
   * @remarks
   * ## Why
   * The value coordinates delayed anchor interactions and native popover state.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open: boolean;
}

/** Initial tooltip identity and visibility.
 * @remarks
 * ## Why
 * Requiring an id makes the accessibility relationship explicit.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category Open state
 */
export interface InitialState {
  /** Stable tooltip id.
   * @remarks
   * ## Why
   * Deterministic ids prevent SSR/client relationship drift.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /** Initial visibility, defaulting to false.
   * @remarks
   * ## Why
   * Closed is the deterministic default before user focus or hover.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open?: boolean;
}

/** Schema for tooltip hydration state.
 * @remarks
 * ## Why
 * Shared identity/open encoding keeps SSR and browser relationships compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category Open state
 */
export const StateSchema = Schema.Struct({ id: Schema.String, open: Schema.Boolean });

/** Creates hydrated tooltip state.
 * @remarks
 * ## Why
 * Visibility logic can be tested without mounting an anchor or popover.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Tooltip from "@typed/ui/Tooltip"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Tooltip.makeState({ id: "save-help" })
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, { id: initial.id, open: initial.open ?? false });
}

/** Sets tooltip visibility.
 * @remarks
 * ## Why
 * Delayed focus/hover logic converges on one explicit state transition.
 * ## Ownership and lifetime
 * The Effect uses the existing state Scope and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Tooltip from "@typed/ui/Tooltip"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Tooltip.makeState({ id: "save-help" })
 *   yield* Tooltip.setOpen(state, true)
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

const scheduleVersions = new WeakMap<object, number>();

const scheduleOpen = Effect.fn(function* <E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
  delay: number,
) {
  const version = (scheduleVersions.get(state) ?? 0) + 1;
  scheduleVersions.set(state, version);
  if (delay > 0) yield* Effect.sleep(delay);
  if (scheduleVersions.get(state) === version) yield* setOpen(state, open);
});

/** Options for a tooltip anchor host.
 * @remarks
 * ## Why
 * Pointer entry works with the default span. Keyboard focus behavior requires
 * the host itself to be focusable, for example `props: { tabindex: 0 }` or a
 * focusable custom host; focus and blur on descendants do not bubble to it.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners/timers by Scope.
 * @since 1.0.0
 * @category Pointer and focus anchors
 */
export interface AnchorOptions extends Dom.HostOptions<HTMLSpanElement> {
  /** Hydrated state shared with tooltip content.
   * @remarks
   * ## Why
   * Its id drives `aria-describedby` and its open value drives the popover.
   * ## Ownership and lifetime
   * The anchor borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Anchor content.
   * @remarks
   * ## Why
   * The anchor wraps descriptive content. A focusable descendant does not make
   * the default span receive its non-bubbling focus and blur handlers.
   * ## Ownership and lifetime
   * Dynamic content follows the anchor Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** Delay in milliseconds before opening.
   * @remarks
   * ## Why
   * A delay avoids accidental tooltip activation during pointer transit.
   * ## Ownership and lifetime
   * Delayed Effects run inside the component interaction lifetime; newer
   * schedules invalidate older versions.
   * @since 1.0.0
   * @category Interaction delays
   */
  readonly showDelay?: number;
  /** Delay in milliseconds before closing.
   * @remarks
   * ## Why
   * A delay prevents flicker during brief pointer movement.
   * ## Ownership and lifetime
   * Newer schedules invalidate older delayed updates.
   * @since 1.0.0
   * @category Interaction delays
   */
  readonly hideDelay?: number;
}

function anchorInternalProps<const Options extends AnchorOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);

  return () =>
    ({
      "aria-describedby": id,
      onfocus: scheduleOpen(options.state, true, options.showDelay ?? 0),
      onblur: scheduleOpen(options.state, false, options.hideDelay ?? 0),
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key === "Escape") yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onmouseenter: scheduleOpen(options.state, true, options.showDelay ?? 0),
      onmouseleave: scheduleOpen(options.state, false, options.hideDelay ?? 0),
    }) as const;
}

type AnchorInternalProps<Options extends AnchorOptions> = ReturnType<
  ReturnType<typeof anchorInternalProps<Options>>
>;

/** Renders a tooltip anchor with pointer and optional host-focus behavior.
 * @remarks
 * ## Why
 * The default host is a non-focusable `<span>`, so it provides pointer behavior
 * only. Give that host `tabindex`, or supply a natively focusable custom host,
 * to activate its direct focus, blur, and keydown handlers. Those events are
 * attached to the host itself and do not observe focus on nested content.
 * Tooltip content remains descriptive rather than an interactive dialog.
 * ## Ownership and lifetime
 * Running the Fx owns event listeners and dynamic relationship state in its
 * Scope. Custom hosts must preserve `aria-describedby` and all handlers.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Tooltip from "@typed/ui/Tooltip"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Tooltip.makeState({ id: "save-help" })
 *   return Tooltip.Anchor({
 *     state,
 *     content: "Save",
 *     props: { tabindex: 0 }
 *   })
 * })
 * ```
 * @since 1.0.0
 * @category Pointer and focus anchors
 */
export function Anchor<const Options extends AnchorOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AnchorInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()<
    Options,
    AnchorInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    anchorInternalProps(options),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

/** Options for native tooltip popover content.
 * @remarks
 * ## Why
 * The role and native top-layer lifecycle remain explicit.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners/ref observation by Scope.
 * @since 1.0.0
 * @category Native content host
 */
export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Hydrated state supplying content id and visibility.
   * @remarks
   * ## Why
   * One source keeps ARIA relationship and native popover state aligned.
   * ## Ownership and lifetime
   * Content borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Non-interactive explanatory tooltip content.
   * @remarks
   * ## Why
   * Tooltip content describes its anchor and must not contain required controls.
   * ## Ownership and lifetime
   * Dynamic content follows the content Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  return () =>
    ({
      id,
      role: "tooltip",
      popover: "manual",
      onmouseenter: scheduleOpen(options.state, true, 0),
      onmouseleave: EventHandler.make(
        Effect.fn(function* (event: MouseEvent) {
          const contentId = (yield* options.state).id;
          if (
            event.relatedTarget instanceof Element &&
            event.relatedTarget.getAttribute("aria-describedby") === contentId
          )
            return;
          yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key === "Escape") yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      ontoggle: EventHandler.make(
        Effect.fn((event: Event) => setOpen(options.state, Dom.toggleState(event) === "open")),
      ),
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}

type ContentInternalProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentInternalProps<Options>>
>;

/** Renders `role="tooltip"` content through the native Popover API.
 * @remarks
 * ## Why
 * Native top-layer output avoids reparenting into a private portal while real
 * toggle/mouse/keyboard events synchronize renderer-independent state.
 * ## Ownership and lifetime
 * Running the Fx owns listeners and NativePopover observation in its Scope. A
 * custom host must preserve id, role, manual popover, handlers, and one
 * hydration ref owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Tooltip from "@typed/ui/Tooltip"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Tooltip.makeState({ id: "save-help" })
 *   return Tooltip.Content({ state, content: "Stores changes" })
 * })
 * ```
 * @since 1.0.0
 * @category Native content host
 */
export function Content<
  const Options extends ContentOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentInternalProps<Options>>,
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
    ContentInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

/** Canonical widget alias for `Content`.
 * @remarks
 * ## Why
 * The alias provides the widget name while `Content` names compound use.
 * ## Ownership and lifetime
 * It has exactly the same Scope and popover ownership as `Content`.
 * @since 1.0.0
 * @category Native content host
 */
export const Tooltip = Content;
