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
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativeDialog from "./NativeDialog.js";

/** Current renderer-independent dialog visibility.
 * @remarks
 * ## Why
 * State can be controlled and tested without mounting a dialog.
 * ## Ownership and lifetime
 * Plain data retains no resources; RefSubject lifetime is Scope-owned.
 * @since 1.0.0
 * @category Open state
 */
export interface State {
  /** Whether the native dialog is open.
   * @remarks
   * ## Why
   * One value coordinates triggers, native lifecycle, and application state.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open: boolean;
}

const dialogs = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  HTMLDialogElement
>();

/** Optional initial dialog state.
 * @remarks
 * ## Why
 * Omission provides a deterministic closed hydration snapshot.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category Open state
 */
export interface InitialState {
  /** Initial open state, defaulting to false.
   * @remarks
   * ## Why
   * The value seeds the serializable server/client contract.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open?: boolean;
}

/** Schema for dialog hydration state.
 * @remarks
 * ## Why
 * Shared encoding keeps server and browser state compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category Open state
 */
export const StateSchema = Schema.Struct({ open: Schema.Boolean });

/** Creates hydrated dialog state independent of rendering.
 * @remarks
 * ## Why
 * Application transitions can be composed and tested before a native dialog
 * element exists.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Dialog.makeState()
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { open: initial.open ?? false });
}

/** Sets desired dialog visibility.
 * @remarks
 * ## Why
 * Explicit state transitions stay outside renderers and retain Effect typing.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState()
 *   yield* Dialog.setOpen(state, true)
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

/** Marks dialog state closed without requesting native cancellation.
 * @remarks
 * ## Why
 * Programmatic close is distinct from `requestClose`, which runs the browser's
 * cancelable close-request lifecycle.
 * ## Ownership and lifetime
 * The Effect updates existing state and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState({ open: true })
 *   yield* Dialog.close(state)
 * })
 * ```
 * @since 1.0.0
 * @category Direct dismissal
 */
export function close<E, R>(state: RefSubject.RefSubject<State, E, R>): Effect.Effect<State, E, R> {
  return setOpen(state, false);
}

/**
 * Requests the native dialog close lifecycle, including its cancel event.
 * @remarks
 * ## Why
 * The browser's `requestClose()` is cancelable. The fallback dispatches a real
 * cancelable `cancel` event and calls `close()` only when it is accepted, so
 * user handlers retain the same veto point.
 * ## Ownership and lifetime
 * The Effect consults the dialog currently registered for the hydrated state;
 * registration is removed when `Content`'s Scope closes. No dialog is retained
 * after that finalizer.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState({ open: true })
 *   yield* Dialog.requestClose(state)
 * })
 * ```
 * @since 1.0.0
 * @category Cancelable dismissal
 */
export function requestClose(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  returnValue?: string,
): Effect.Effect<void> {
  return Effect.sync(() => {
    const dialog = dialogs.get(state);
    const requestClose = dialog === undefined ? undefined : Reflect.get(dialog, "requestClose");
    if (typeof requestClose === "function") {
      requestClose.call(dialog, returnValue);
    } else if (dialog !== undefined) {
      const accepted = dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
      if (accepted) dialog.close(returnValue);
    }
  });
}

/** Options for a dialog-opening button.
 * @remarks
 * ## Why
 * The trigger exposes dialog relationship and expanded state to the platform.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners/subscriptions by Scope.
 * @since 1.0.0
 * @category Opening controls
 */
export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  /** Hydrated state shared with dialog content.
   * @remarks
   * ## Why
   * One source drives `aria-expanded` and dialog visibility.
   * ## Ownership and lifetime
   * The trigger borrows state; its originating Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Dialog id targeted by native command attributes.
   * @remarks
   * ## Why
   * With an id, the trigger emits `commandfor` and `command="show-modal"` and
   * deliberately omits its Fx click fallback. That form therefore requires
   * browser support for native command attributes. Without `controls`, Typed
   * installs the state-driven click fallback instead.
   * ## Ownership and lifetime
   * The string is reflected and retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly controls?: string;
  /** Visible trigger content and accessible name.
   * @remarks
   * ## Why
   * A dialog trigger must be discoverable to assistive technology.
   * ## Ownership and lifetime
   * Dynamic content follows the trigger Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function triggerInternalProps<const Options extends TriggerOptions>(options: Options) {
  const open = RefSubject.map(options.state, (state) => state.open);
  const show = setOpen(options.state, true);
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": property("controls", undefined),
      commandfor: property("controls", undefined),
      command: options.controls === undefined ? undefined : "show-modal",
      onclick: options.controls === undefined ? show : undefined,
    }) as const;
}

type TriggerInternalProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerInternalProps<Options>>
>;

/** Renders a native button that opens dialog content.
 * @remarks
 * ## Why
 * It preserves button semantics, real events, and ARIA relationship state.
 * Supplying `controls` selects native `commandfor` / `show-modal` behavior and
 * disables the Fx click fallback, so that form requires browser command support.
 * Omitting `controls` installs the portable state-driven click handler.
 * ## Ownership and lifetime
 * Running the Fx owns reactive props/listeners in its Scope. A custom host must
 * preserve button type, ARIA, command, click props, and content.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState()
 *   // Omitting controls selects the Fx state fallback.
 *   return Dialog.Trigger({ state, content: "Open" })
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

interface ContentOptionsBase extends Dom.HostOptions<HTMLDialogElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly id?: string;
  readonly describedBy?: Renderable.Any<string | null | undefined>;
  readonly modal?: boolean;
}

type AccessibleName =
  | {
      readonly label: Renderable.Any<string | null | undefined>;
      readonly labelledBy?: never;
    }
  | {
      readonly label?: never;
      readonly labelledBy: Renderable.Any<string | null | undefined>;
    };

/**
 * Dialog content options with exactly one accessible naming strategy.
 * @remarks
 * ## Why
 * A dialog requires an accessible name. The union makes `label` and
 * `labelledBy` mutually exclusive at compile time instead of silently choosing.
 *
 * ## Options
 *
 * `state` synchronizes the native element, `content` renders its subtree, `id`
 * provides a target for browsers supporting native commands, `describedBy`
 * connects supporting text, and
 * `modal` selects `showModal()` by default or `show()` when explicitly false.
 * The supplied label values may be reactive, but the command target id is a
 * stable string so the server and client address the same element.
 * ## Ownership and lifetime
 * Options are inert; rendering owns dynamic values and native synchronization
 * for its Effect Scope.
 * @since 1.0.0
 * @category Native content host
 */
export type ContentOptions = ContentOptionsBase & AccessibleName;

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const synchronize = NativeDialog.ref(options.state, { modal: options.modal });
  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    id: property("id", undefined),
    "aria-labelledby": property("labelledBy", undefined),
    "aria-describedby": property("describedBy", undefined),
    "aria-label": property("label", undefined),
    oncancel: close(options.state),
    // Native close events are queued. The same dialog may already have reopened
    // by the time an earlier close event is delivered.
    onclose: EventHandler.make(
      Effect.fn((event: Event) =>
        setOpen(options.state, Dom.currentTarget<HTMLDialogElement>(event).open),
      ),
    ),
    ontoggle: EventHandler.make(
      Effect.fn((event: Event) =>
        setOpen(options.state, Dom.currentTarget<HTMLDialogElement>(event).open),
      ),
    ),
    ref: Dom.composeRefs(options.state, Dom.composeRefs(synchronize, dialogRef(options.state))),
  });
}

function dialogRef(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
): (dialog: HTMLDialogElement) => Effect.Effect<void, never, Scope.Scope> {
  return Effect.fn(function* (dialog) {
    dialogs.set(state, dialog);
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        if (dialogs.get(state) === dialog) dialogs.delete(state);
      }),
    );
  });
}

type ContentInternalProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentInternalProps<Options>>
>;

/**
 * Renders native dialog content synchronized with hydrated state.
 * @remarks
 * ## Why
 * `Content` uses a real `<dialog>` and its `show()`, `showModal()`, `close()`,
 * `cancel`, `close`, and `toggle` lifecycle. The browser therefore owns focus,
 * top-layer placement, modal inertness, and default Escape behavior.
 * ## Ownership and lifetime
 * Running the Fx owns native listeners, dialog registration, and the
 * NativeDialog observer in its Effect Scope. Finalization removes registration
 * only when it still points at this element. A custom host must preserve native
 * dialog identity, naming props, lifecycle handlers, and exactly one hydration
 * ref owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState()
 *   return Dialog.Content({
 *     state,
 *     id: "confirm",
 *     label: "Confirm",
 *     content: "Continue?"
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
  return Dom.renderHost<HTMLDialogElement>()<
    Options,
    ContentInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentInternalProps(options), options.content, (props, content) => {
    return html`<dialog ...${props}>${content}</dialog>`;
  });
}

/** Canonical widget alias for `Content`.
 * @remarks
 * ## Why
 * The alias provides the widget name while `Content` identifies compound use.
 * ## Ownership and lifetime
 * It has exactly the same native element and Scope ownership as `Content`.
 * @since 1.0.0
 * @category Native content host
 */
export const Dialog = Content;

/** Options for dialog close and close-request buttons.
 * @remarks
 * ## Why
 * Supplying `controls` selects native commands and removes the Fx click
 * fallback, requiring command-attribute browser support. Omitting it keeps the
 * state-driven close or request-close handler.
 * ## Ownership and lifetime
 * Options are inert; rendering owns listeners and dynamic content by Scope.
 * @since 1.0.0
 * @category Direct dismissal
 */
export interface CloseOptions extends Dom.HostOptions<HTMLButtonElement> {
  /** Hydrated state for fallback close behavior.
   * @remarks
   * ## Why
   * Closing remains available when no native command target id is supplied.
   * ## Ownership and lifetime
   * The button borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Dialog id targeted by native command attributes.
   * @remarks
   * ## Why
   * Native command routing preserves the dialog's platform lifecycle, but
   * selecting it omits the component's click fallback. Use it only where
   * `commandfor` and the requested dialog command are supported; otherwise
   * omit `controls`.
   * ## Ownership and lifetime
   * The string is reflected and retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly controls?: string;
  /** Visible button content and accessible name.
   * @remarks
   * ## Why
   * Every close action needs a discoverable label.
   * ## Ownership and lifetime
   * Dynamic content follows the button Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function closeInternalProps<const Options extends CloseOptions>(
  options: Options,
  requestCloseLifecycle: boolean,
) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      commandfor: property("controls", undefined),
      command:
        options.controls === undefined
          ? undefined
          : requestCloseLifecycle
            ? "request-close"
            : "close",
      onclick:
        options.controls !== undefined
          ? undefined
          : requestCloseLifecycle
            ? requestClose(options.state)
            : close(options.state),
    }) as const;
}

type CloseInternalProps<Options extends CloseOptions> = ReturnType<
  ReturnType<typeof closeInternalProps<Options>>
>;

/** Renders a button that closes a dialog without a cancel request.
 * @remarks
 * ## Why
 * Accepted actions need a direct close path distinct from cancelable dismissal.
 * `controls` selects native `command="close"` and disables the Fx click
 * fallback; omit it when native dialog commands are unavailable.
 * ## Ownership and lifetime
 * Running the Fx owns handlers/dynamic content by Scope. Custom hosts must
 * preserve type, command or fallback click behavior, and content.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState({ open: true })
 *   return Dialog.Close({ state, content: "Done" })
 * })
 * ```
 * @since 1.0.0
 * @category Direct dismissal
 */
export function Close<const Options extends CloseOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CloseInternalProps<Options>>,
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
    CloseInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    closeInternalProps(options, false),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/** Alias for direct `Close` behavior.
 * @remarks
 * ## Why
 * The alias supports dismissal vocabulary without introducing another lifecycle.
 * ## Ownership and lifetime
 * It has exactly the same Scope and native button ownership as `Close`.
 * @since 1.0.0
 * @category Direct dismissal
 */
export const Dismiss = Close;

/** Renders a button that starts the cancelable native close-request lifecycle.
 * @remarks
 * ## Why
 * Consumers can intercept a real `cancel` event before the dialog closes.
 * `controls` selects native `command="request-close"` and disables the Fx click
 * fallback; omit it when native dialog commands are unavailable.
 * ## Ownership and lifetime
 * Running the Fx owns handlers by Scope; dialog registration remains owned by
 * the corresponding `Content` Scope.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Dialog from "@typed/ui/Dialog"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Dialog.makeState({ open: true })
 *   return Dialog.RequestClose({ state, content: "Cancel" })
 * })
 * ```
 * @since 1.0.0
 * @category Cancelable dismissal
 */
export function RequestClose<
  const Options extends CloseOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CloseInternalProps<Options>>,
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
    CloseInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    closeInternalProps(options, true),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

/** Options for an accessible dialog heading.
 * @remarks
 * ## Why
 * A stable id can serve as the dialog's `aria-labelledby` target.
 * ## Ownership and lifetime
 * Options are inert; dynamic values follow the component Scope.
 * @since 1.0.0
 * @category Dialog naming and description
 */
export interface HeadingOptions extends Dom.HostOptions<HTMLHeadingElement> {
  /** Heading content.
   * @remarks
   * ## Why
   * Visible text supplies the dialog's accessible name when referenced.
   * ## Ownership and lifetime
   * Dynamic content follows the heading Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** Optional id referenced by `Content.labelledBy`.
   * @remarks
   * ## Why
   * Stable relationships are required for accessible naming and hydration.
   * ## Ownership and lifetime
   * The id is reflected and retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id?: string;
  /** ARIA heading level, defaulting to two.
   * @remarks
   * ## Why
   * The level preserves document hierarchy independently of visual style.
   * ## Ownership and lifetime
   * The value is reflected and retains no resources.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
}

function headingInternalProps<const Options extends HeadingOptions>() {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: property("id", undefined),
      role: "heading",
      "aria-level": property("level", 2),
    }) as const;
}

type HeadingInternalProps<Options extends HeadingOptions> = ReturnType<
  ReturnType<typeof headingInternalProps<Options>>
>;

/** Renders a dialog heading with explicit ARIA level semantics.
 * @remarks
 * ## Why
 * The helper creates a reliable naming target and preserves heading hierarchy.
 * ## Ownership and lifetime
 * Running the Fx owns dynamic content by Scope. A custom host must preserve id,
 * role, and `aria-level`.
 * @example
 * ```ts
 * import { Heading } from "@typed/ui/Dialog"
 *
 * const title = Heading({ id: "confirm-title", content: "Confirm" })
 * ```
 * @since 1.0.0
 * @category Dialog naming and description
 */
export function Heading<
  const Options extends HeadingOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, HeadingInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLHeadingElement>()<
    Options,
    HeadingInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    headingInternalProps(),
    options.content,
    (props, content) => html`<h2 ...${props}>${content}</h2>`,
  );
}

/** Options for descriptive dialog text.
 * @remarks
 * ## Why
 * A stable id lets dialog content establish `aria-describedby` explicitly.
 * ## Ownership and lifetime
 * Options are inert; dynamic content follows the component Scope.
 * @since 1.0.0
 * @category Dialog naming and description
 */
export interface DescriptionOptions extends Dom.HostOptions<HTMLParagraphElement> {
  /** Descriptive content.
   * @remarks
   * ## Why
   * Referenced text supplies context beyond the dialog's accessible name.
   * ## Ownership and lifetime
   * Dynamic content follows the description Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** Optional id referenced by `Content.describedBy`.
   * @remarks
   * ## Why
   * A stable DOM relationship exposes the description to assistive technology.
   * ## Ownership and lifetime
   * The id is reflected and retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id?: string;
}

function descriptionInternalProps<const Options extends DescriptionOptions>() {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({ id: property("id", undefined) }) as const;
}

type DescriptionInternalProps<Options extends DescriptionOptions> = ReturnType<
  ReturnType<typeof descriptionInternalProps<Options>>
>;

/** Renders descriptive dialog text with an optional relationship id.
 * @remarks
 * ## Why
 * The helper keeps accessible description wiring explicit and platform-native.
 * ## Ownership and lifetime
 * Running the Fx owns dynamic content by Scope. A custom host must preserve id.
 * @example
 * ```ts
 * import { Description } from "@typed/ui/Dialog"
 *
 * const detail = Description({ id: "confirm-detail", content: "This cannot be undone." })
 * ```
 * @since 1.0.0
 * @category Dialog naming and description
 */
export function Description<
  const Options extends DescriptionOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, DescriptionInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLParagraphElement>()<
    Options,
    DescriptionInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    descriptionInternalProps<Options>(),
    options.content,
    (props, content) => html`<p ...${props}>${content}</p>`,
  );
}
