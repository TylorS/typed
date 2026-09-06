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
import * as NativeDetails from "./NativeDetails.js";

/** Current renderer-independent disclosure state.
 * @remarks
 * ## Why
 * Open state remains testable without mounting native details content.
 * ## Ownership and lifetime
 * Plain state retains no resources; RefSubject lifetime is Scope-owned.
 * @since 1.0.0
 * @category Open state
 */
export interface State {
  /** Whether the details element is open.
   * @remarks
   * ## Why
   * One field coordinates application state with native element state.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open: boolean;
}

/** Optional initial disclosure state.
 * @remarks
 * ## Why
 * Omission produces a deterministic closed SSR snapshot.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category Open state
 */
export interface InitialState {
  /** Initial open state, defaulting to false.
   * @remarks
   * ## Why
   * The value seeds the hydration contract.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open?: boolean;
}

/** Schema for disclosure hydration state.
 * @remarks
 * ## Why
 * Shared encoding keeps server and browser state compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category Open state
 */
export const StateSchema = Schema.Struct({ open: Schema.Boolean });

/** Creates hydrated disclosure state.
 * @remarks
 * ## Why
 * Applications can own and test open-state transitions independently of UI.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Disclosure from "@typed/ui/Disclosure"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Disclosure.makeState({ open: true })
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { open: initial.open ?? false });
}

/** Sets disclosure visibility.
 * @remarks
 * ## Why
 * Explicit state transitions remain composable with Effect and outside renderers.
 * ## Ownership and lifetime
 * The Effect reuses the existing state lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Disclosure from "@typed/ui/Disclosure"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Disclosure.makeState()
 *   yield* Disclosure.setOpen(state, true)
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

/** Options for the native `<summary>` trigger.
 * @remarks
 * ## Why
 * Summary preserves built-in pointer, keyboard, and disclosure behavior.
 * ## Ownership and lifetime
 * Options are inert; dynamic content follows the rendered Scope.
 * @since 1.0.0
 * @category Summary activation
 */
export interface ButtonOptions extends Dom.HostOptions<HTMLElement> {
  /** Visible summary content and accessible name.
   * @remarks
   * ## Why
   * Native summary content labels its containing details element.
   * ## Ownership and lifetime
   * Dynamic content follows the trigger Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function buttonInternalProps() {
  return {};
}

type ButtonInternalProps = ReturnType<typeof buttonInternalProps>;

/** Renders a native `<summary>` disclosure trigger.
 * @remarks
 * ## Why
 * The browser owns activation and toggling; Typed does not emulate them with
 * click handlers or synthetic events.
 * ## Ownership and lifetime
 * Running the Fx owns dynamic content in its Scope. A custom host must remain a
 * valid summary participant inside the associated details element.
 * @example
 * ```ts
 * import { Button } from "@typed/ui/Disclosure"
 *
 * const summary = Button({ content: "Advanced settings" })
 * ```
 * @since 1.0.0
 * @category Summary activation
 */
export function Button<const Options extends ButtonOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ButtonInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLElement>()<
    Options,
    ButtonInternalProps,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    buttonInternalProps,
    options.content,
    (props, content) => html`<summary ...${props}>${content}</summary>`,
  );
}

/** Options for native `<details>` content.
 * @remarks
 * ## Why
 * A shared state lets application code observe and control the browser-owned
 * disclosure lifecycle.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners and the NativeDetails observer.
 * @since 1.0.0
 * @category Native content host
 */
export interface ContentOptions extends Dom.HostOptions<HTMLDetailsElement> {
  /** Hydrated state synchronized with the details element.
   * @remarks
   * ## Why
   * Native toggle events and application updates converge on one source.
   * ## Ownership and lifetime
   * The content borrows state; its originating Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Summary and disclosed body content.
   * @remarks
   * ## Why
   * Keeping the subtree renderable preserves Typed error/service composition.
   * ## Ownership and lifetime
   * Dynamic content follows the details Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  return () =>
    ({
      ontoggle: EventHandler.make(
        Effect.fn((event: Event) =>
          setOpen(options.state, Dom.currentTarget<HTMLDetailsElement>(event).open),
        ),
      ),
      ref: Dom.composeRefs(options.state, NativeDetails.ref(options.state)),
    }) as const;
}

type ContentInternalProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentInternalProps<Options>>
>;

/** Renders native details content synchronized with hydrated state.
 * @remarks
 * ## Why
 * Native disclosure behavior, semantics, and `toggle` events stay intact while
 * Effect state can control or observe visibility.
 * ## Ownership and lifetime
 * Running the Fx owns the native listener and scoped observer. A custom host
 * must preserve the toggle handler and exactly one composed hydration ref.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Disclosure from "@typed/ui/Disclosure"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Disclosure.makeState()
 *   return Disclosure.Content({
 *     state,
 *     content: Disclosure.Button({ content: "More" })
 *   })
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
  return Dom.renderHost<HTMLDetailsElement>()<
    Options,
    ContentInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentInternalProps(options), options.content, (props, content) => {
    return html`<details ...${props}>${content}</details>`;
  });
}

/** Canonical alias for `Content`.
 * @remarks
 * ## Why
 * The widget name remains convenient while `Content` identifies its role in
 * compound composition.
 * ## Ownership and lifetime
 * It has exactly the same Scope and details-element ownership as `Content`.
 * @since 1.0.0
 * @category Native content host
 */
export const Disclosure = Content;
