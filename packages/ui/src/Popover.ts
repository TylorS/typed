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

/** Current renderer-independent popover visibility.
 * @remarks
 * ## Why
 * Open state can be controlled and tested without rendering the top layer.
 * ## Ownership and lifetime
 * Plain data retains no resources; RefSubject lifetime is Scope-owned.
 * @since 1.0.0
 * @category Open state
 */
export interface State {
  /** Whether native popover content should be open.
   * @remarks
   * ## Why
   * The value coordinates trigger ARIA state and native Popover API state.
   * ## Ownership and lifetime
   * Plain state acquires no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open: boolean;
}

/** Optional initial popover visibility.
 * @remarks
 * ## Why
 * A false default gives SSR and hydration a deterministic closed snapshot.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category Open state
 */
export interface InitialState {
  /** Initial open state, defaulting to false.
   * @remarks
   * ## Why
   * The value seeds the serializable hydration contract.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open?: boolean;
}

/** Schema for serialized popover state.
 * @remarks
 * ## Why
 * A shared boolean shape keeps server and browser hydration compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category Open state
 */
export const StateSchema = Schema.Struct({ open: Schema.Boolean });

/** Creates hydrated popover state.
 * @remarks
 * ## Why
 * Applications can own and test visibility independently of a component.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Popover.makeState()
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { open: initial.open ?? false });
}

/** Sets popover visibility atomically.
 * @remarks
 * ## Why
 * Explicit state transitions coordinate trigger and content without hidden
 * component-local state.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Popover.makeState()
 *   yield* Popover.setOpen(state, true)
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

/** Options for the native popover trigger.
 * @remarks
 * ## Why
 * The trigger exposes native target attributes when an id is supplied and a
 * state-driven fallback otherwise.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners/subscriptions by Scope.
 * @since 1.0.0
 * @category Opening controls
 */
export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  /** Hydrated state shared with popover content.
   * @remarks
   * ## Why
   * It drives `aria-expanded` and fallback activation from one source.
   * ## Ownership and lifetime
   * The trigger borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Id of content targeted through native `popovertarget`.
   * @remarks
   * ## Why
   * Native targeting lets the browser run the Popover API lifecycle directly.
   * ## Ownership and lifetime
   * The string is reflected and retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly controls?: string;
  /** Visible trigger content and accessible name.
   * @remarks
   * ## Why
   * A trigger needs a discoverable accessible name.
   * ## Ownership and lifetime
   * Dynamic content follows the trigger Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function triggerInternalProps<const Options extends TriggerOptions>(options: Options) {
  const open = RefSubject.map(options.state, (state) => state.open);
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      "aria-expanded": open,
      popovertarget: property("controls", undefined),
      popovertargetaction: options.controls === undefined ? undefined : "show",
      onclick: options.controls === undefined ? setOpen(options.state, true) : undefined,
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key !== "Escape") return;
          event.preventDefault();
          yield* setOpen(options.state, false);
        }),
      ),
    }) as const;
}

type TriggerInternalProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerInternalProps<Options>>
>;

/** Renders a native button that opens popover content.
 * @remarks
 * ## Why
 * It preserves button keyboard behavior, native target commands, real DOM
 * events, and an explicit state fallback when no target id is supplied.
 * ## Ownership and lifetime
 * Running the Fx owns reactive ARIA state and listeners in its Scope. A custom
 * host must preserve button type, target props, `aria-expanded`, and handlers.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Popover.makeState()
 *   return Popover.Trigger({ state, controls: "account", content: "Account" })
 * })
 * ```
 * @since 1.0.0
 * @category Opening controls
 */
export function Trigger<
  const Options extends TriggerOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TriggerInternalProps<Options>>,
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
    TriggerInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    triggerInternalProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/** Options for manually controlled native popover content.
 * @remarks
 * ## Why
 * Content and state remain explicit while the browser owns top-layer behavior.
 * ## Ownership and lifetime
 * Options are inert; rendering owns the native ref and subscriptions by Scope.
 * @since 1.0.0
 * @category Native content host
 */
export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Hydrated state synchronized with native popover visibility.
   * @remarks
   * ## Why
   * Native toggle events and application updates converge on one source.
   * ## Ownership and lifetime
   * The content borrows the state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Content rendered in the top layer.
   * @remarks
   * ## Why
   * Renderable output retains Typed error and service channels.
   * ## Ownership and lifetime
   * Dynamic content follows the content Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  return () =>
    ({
      popover: "manual",
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key !== "Escape") return;
          event.preventDefault();
          yield* setOpen(options.state, false);
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

/** Renders manually controlled native popover content.
 * @remarks
 * ## Why
 * The component delegates top-layer lifecycle to the Popover API, synchronizes
 * completed `toggle` events, and handles Escape through native events.
 * ## Ownership and lifetime
 * Running the Fx owns listeners and the NativePopover observer in its Effect
 * Scope. A custom host must preserve `popover="manual"`, the toggle handler, and
 * the single composed hydration ref.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Popover from "@typed/ui/Popover"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Popover.makeState()
 *   return Popover.Content({ state, content: "Preferences" })
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
