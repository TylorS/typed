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

/** Current hovercard identity and visibility.
 * @remarks
 * ## Why
 * A stable id links the anchor to focusable native popover content while state
 * remains renderer-independent.
 * ## Ownership and lifetime
 * Plain data retains no resources; RefSubject observation is Scope-owned.
 * @since 1.0.0
 * @category Open state
 */
export interface State {
  /** Stable id used by `aria-controls` and content.
   * @remarks
   * ## Why
   * Deterministic identity preserves server/client DOM relationships.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /** Whether the hovercard is open.
   * @remarks
   * ## Why
   * One value coordinates delayed interactions and native popover state.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open: boolean;
}

/** Initial hovercard identity and visibility.
 * @remarks
 * ## Why
 * Requiring an id makes the anchor/content relationship explicit.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category Open state
 */
export interface InitialState {
  /** Stable content id.
   * @remarks
   * ## Why
   * Explicit ids prevent hydration relationship drift.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly id: string;
  /** Initial visibility, defaulting to false.
   * @remarks
   * ## Why
   * Closed is deterministic before focus or hover interaction.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category Open state
   */
  readonly open?: boolean;
}

/** Schema for hovercard hydration state.
 * @remarks
 * ## Why
 * Shared identity/open encoding keeps SSR and browser state compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category Open state
 */
export const StateSchema = Schema.Struct({ id: Schema.String, open: Schema.Boolean });

/** Creates hydrated hovercard state.
 * @remarks
 * ## Why
 * Visibility and identity can be tested without mounting UI.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Hovercard from "@typed/ui/Hovercard"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Hovercard.makeState({ id: "author-card" })
 * })
 * ```
 * @since 1.0.0
 * @category Open state
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, { id: initial.id, open: initial.open ?? false });
}

/** Sets hovercard visibility.
 * @remarks
 * ## Why
 * Delayed focus/hover flows converge on one atomic state update.
 * ## Ownership and lifetime
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Hovercard from "@typed/ui/Hovercard"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Hovercard.makeState({ id: "author-card" })
 *   yield* Hovercard.setOpen(state, true)
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

/** Options for a hovercard anchor host.
 * @remarks
 * ## Why
 * Pointer entry works with the default span. Keyboard focus behavior requires
 * the host itself to be focusable, for example `props: { tabindex: 0 }` or a
 * focusable custom host; focus and blur on descendants do not bubble to it.
 * ## Ownership and lifetime
 * Options are inert; rendering owns handlers/delayed effects by Scope.
 * @since 1.0.0
 * @category Pointer and focus anchors
 */
export interface AnchorOptions extends Dom.HostOptions<HTMLSpanElement> {
  /** Hydrated state shared with hovercard content.
   * @remarks
   * ## Why
   * Its id and open state coordinate the whole compound widget.
   * ## Ownership and lifetime
   * The anchor borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Anchor content.
   * @remarks
   * ## Why
   * The wrapper retains nested content, but focusable descendants do not
   * activate the default span's non-bubbling focus and blur handlers.
   * ## Ownership and lifetime
   * Dynamic content follows the anchor Scope.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
  /** Milliseconds before opening.
   * @remarks
   * ## Why
   * Delay filters incidental pointer transit.
   * ## Ownership and lifetime
   * New schedules invalidate older delayed updates.
   * @since 1.0.0
   * @category Interaction delays
   */
  readonly showDelay?: number;
  /** Milliseconds before closing.
   * @remarks
   * ## Why
   * Delay gives users time to move focus or pointer toward content.
   * ## Ownership and lifetime
   * New schedules invalidate older delayed updates.
   * @since 1.0.0
   * @category Interaction delays
   */
  readonly hideDelay?: number;
}

function anchorInternalProps<const Options extends AnchorOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);

  return () =>
    ({
      "aria-controls": id,
      onfocus: scheduleOpen(options.state, true, options.showDelay ?? 0),
      onblur: EventHandler.make(
        Effect.fn(function* (event: FocusEvent) {
          const contentId = (yield* options.state).id;
          const content = Dom.currentTarget<Element>(event).ownerDocument.getElementById(contentId);
          if (event.relatedTarget instanceof Node && content?.contains(event.relatedTarget)) return;
          yield* scheduleOpen(options.state, false, options.hideDelay ?? 0);
        }),
      ),
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

/** Renders an anchor coordinating pointer and optional host-focus behavior.
 * @remarks
 * ## Why
 * The default host is a non-focusable `<span>`, so it provides pointer behavior
 * only. Give the span `tabindex`, or supply a natively focusable custom host,
 * for direct focus, blur, and keydown handling. Unlike a tooltip, hovercard
 * content may receive focus; host blur checks `relatedTarget` and stays open
 * while focus moves inside the card. Nested-anchor focus does not bubble.
 * ## Ownership and lifetime
 * Running the Fx owns real DOM handlers and dynamic relationships in its Scope.
 * Custom hosts must preserve `aria-controls` and all supplied handlers.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Hovercard from "@typed/ui/Hovercard"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Hovercard.makeState({ id: "author-card" })
 *   return Hovercard.Anchor({
 *     state,
 *     content: "Ada Lovelace",
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

interface ContentOptionsBase extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
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

/** Hovercard content options requiring one accessible naming strategy.
 * @remarks
 * ## Why
 * Focusable dialog-like content needs an explicit name; the type makes label
 * and labelled-by mutually exclusive.
 *
 * ## Options
 *
 * `state` provides the stable content id and open state, while `content` may
 * contain focusable output. `label` names the card directly; `labelledBy`
 * references visible naming content. Supplying both is rejected by the type.
 * ## Ownership and lifetime
 * Options are inert; rendering owns content/listeners/native ref by Scope.
 * @since 1.0.0
 * @category Native content host
 */
export type ContentOptions = ContentOptionsBase & AccessibleName;

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id,
      role: "dialog",
      "aria-label": property("label", undefined),
      "aria-labelledby": property("labelledBy", undefined),
      popover: "manual",
      onfocusin: scheduleOpen(options.state, true, 0),
      onfocusout: EventHandler.make(
        Effect.fn(function* (event: FocusEvent) {
          const content = Dom.currentTarget<HTMLElement>(event);
          if (event.relatedTarget instanceof Node && content.contains(event.relatedTarget)) return;
          yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onmouseenter: scheduleOpen(options.state, true, 0),
      onmouseleave: EventHandler.make(
        Effect.fn(function* (event: MouseEvent) {
          const contentId = (yield* options.state).id;
          if (
            event.relatedTarget instanceof Element &&
            event.relatedTarget.getAttribute("aria-controls") === contentId
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

/** Renders named, focusable hovercard content in the native top layer.
 * @remarks
 * ## Why
 * `role="dialog"` distinguishes interactive content from a tooltip. Native
 * popover placement is retained, and focus/pointer transitions prevent closing
 * while interaction remains inside the card.
 * ## Ownership and lifetime
 * Running the Fx owns handlers and NativePopover observation in its Scope. A
 * custom host must preserve id, role, accessible name, manual popover,
 * lifecycle handlers, and one hydration ref owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Hovercard from "@typed/ui/Hovercard"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Hovercard.makeState({ id: "author-card" })
 *   return Hovercard.Content({ state, label: "Author", content: "Mathematician" })
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
  >(options, host, contentInternalProps(options), options.content, (i, content) => {
    return html`<div ...${i}>${content}</div>`;
  });
}

/** Canonical widget alias for `Content`.
 * @remarks
 * ## Why
 * The alias provides the widget name while `Content` names compound use.
 * ## Ownership and lifetime
 * It has exactly the same Scope and native popover ownership as `Content`.
 * @since 1.0.0
 * @category Native content host
 */
export const Hovercard = Content;
