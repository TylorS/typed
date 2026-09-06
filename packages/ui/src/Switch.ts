/**
 * A button-backed on/off setting with a stable accessible name.
 * The internal click toggles boolean state; persistence and form serialization remain explicit.
 *
 * Read the [Switch guide](/explore/ui-switch) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 */
export interface State {
  /**
   */
  readonly checked: boolean;
}

/**
 */
export interface InitialState {
  /**
   */
  readonly checked?: boolean;
}

/**
 */
export const StateSchema = Schema.Struct({ checked: Schema.Boolean });

/**
 * Creates hydrated switch state independent of rendering.
 * @remarks
 * Domain code and tests can own the state while any renderer consumes it.
 * The caller's Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Switch.makeState({ checked: true })
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

/**
 * Sets the switch to the requested checked state.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Switch.makeState()
 *   yield* Switch.setChecked(state, true)
 * })
 * ```
 * @since 1.0.0
 * @category State transitions
 */
export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

/**
 * Toggles the switch between checked and unchecked.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Switch.makeState({ checked: true })
 *   yield* Switch.toggle(state)
 * })
 * ```
 * @since 1.0.0
 * @category State transitions
 */
export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked: !current.checked }));
}

/**
 */
export interface SwitchOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * Hydrated state synchronized with `aria-checked`.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Visible content and accessible name.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content: Renderable.Any;
}

function internalProps<const Options extends SwitchOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      role: "switch",
      "aria-checked": RefSubject.map(options.state, (state) => state.checked),
      "?disabled": property("disabled", false),
      onclick: toggle(options.state),
      ref: options.state,
    }) as const;
}
type SwitchInternalProps<Options extends SwitchOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/**
 * Renders a button-backed ARIA switch.
 * @remarks
 * The component combines native button activation with a renderer-independent
 * boolean state and real DOM click events.
 * Running the Fx owns listener/state subscriptions in its Effect Scope. A
 * custom host must preserve button type, role, `aria-checked`, click handler,
 * and the single hydration ref owner.
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as Switch from "@typed/ui/Switch";
 *
 * export const PreviewSetting = component(function* () {
 *   const state = yield* Switch.makeState({ checked: true });
 *   const status = RefSubject.map(state, ({ checked }) => checked ? "On" : "Off");
 *   return html`<section>
 *     ${Switch.Switch({
 *       state,
 *       content: "Show live preview",
 *       props: { class: "preview-switch", "aria-describedby": "preview-setting-help" },
 *     })}
 *     <span aria-hidden="true">${status}</span>
 *     <p id="preview-setting-help">Updates the preview while you edit.</p>
 *   </section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function Switch<const Options extends SwitchOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SwitchInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SwitchInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, internalProps(options), options.content, (props, content) => {
    return html`<button ...${props}>${content}</button>`;
  });
}
