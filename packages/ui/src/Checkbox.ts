/**
 * A native checkbox synchronized with boolean or mixed state.
 * The checked and indeterminate properties are separate; mixed is not a submitted third value.
 *
 * Read the [Checkbox guide](/explore/ui-checkbox) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 */
export type Checked = boolean | "mixed";

/**
 * Current renderer-independent checkbox state.
 * @remarks
 * State can be updated and tested through RefSubject before any input mounts.
 * The value is plain data; the hydrated RefSubject returned by `makeState`
 * owns observation for its Effect Scope.
 * @since 1.0.0
 * @category State models
 */
export interface State {
  /**
   */
  readonly checked: Checked;
}

/**
 */
export interface InitialState {
  /**
   */
  readonly checked?: Checked;
}

/**
 */
export const StateSchema = Schema.Struct({
  checked: Schema.Literals([true, false, "mixed"]),
});

/**
 * Creates hydrated, renderer-independent checkbox state.
 * @remarks
 * State transitions remain testable without rendering and can be consumed by
 * any UI producer.
 * The caller's Effect Scope owns the hydrated RefSubject and its subscriptions.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Checkbox.makeState({ checked: "mixed" })
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

/**
 * Sets the checkbox state to a boolean or mixed value.
 * @remarks
 * A single atomic RefSubject update keeps DOM properties and ARIA state aligned.
 * The Effect uses the existing subject lifetime and acquires no new resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Checkbox.makeState()
 *   yield* Checkbox.setChecked(state, true)
 * })
 * ```
 * @since 1.0.0
 * @category State transitions
 */
export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: Checked,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

/**
 * Toggles checked state, treating the mixed state as unchecked.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Checkbox.makeState({ checked: "mixed" })
 *   yield* Checkbox.toggle(state)
 * })
 * ```
 * @since 1.0.0
 * @category State transitions
 */
export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    checked: current.checked === true ? false : true,
  }));
}

/**
 */
export interface InputOptions extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Hydrated state synchronized with the input.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
}

function internalProps<const Options extends InputOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.checked === true);
  const indeterminate = RefSubject.map(options.state, (state) => state.checked === "mixed");
  const onChange = EventHandler.make(
    Effect.fn((event: Event) =>
      setChecked(options.state, Dom.currentTarget<HTMLInputElement>(event).checked),
    ),
  );

  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "checkbox",
    "aria-checked": RefSubject.map(options.state, (state) => state.checked),
    "?checked": checked,
    ".checked": checked,
    "?disabled": property("disabled", false),
    "?required": property("required", false),
    ".indeterminate": indeterminate,
    onchange: onChange,
    ref: options.state,
  });
}

type InputInternalProps<Options extends InputOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/**
 * Renders a native checkbox input synchronized with hydrated state.
 * @remarks
 * Native keyboard, form, disabled, required, and accessibility behavior remain
 * available while state is exposed through RefSubject.
 * Running the Fx installs native listeners and state subscriptions in its
 * Scope. A custom host must apply `type`, checked, indeterminate, ARIA, and ref
 * props; only one hydration owner may be composed for the element.
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import * as Checkbox from "@typed/ui/Checkbox";
 * import { component } from "@typed/ui/Component";
 *
 * export const UpdatePreference = component(function* () {
 *   const state = yield* Checkbox.makeState({ checked: false });
 *   const message = RefSubject.map(state, ({ checked }) =>
 *     checked === true ? "Product updates enabled" : "Product updates disabled",
 *   );
 *   return html`<div class="preference">
 *     <label>
 *       ${Checkbox.Input({ state, props: { name: "updates", value: "yes" } })}
 *       Receive product updates
 *     </label>
 *     <p>${message}</p>
 *   </div>`;
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function Input<const Options extends InputOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    InputInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (i) => {
    return html`<input ...${i} />`;
  });
}

/**
 * Canonical component alias for `Input`.
 * @remarks
 * The alias provides the widget name while retaining the explicit input API.
 * It has exactly the same Scope and native-element ownership as `Input`.
 * @since 1.0.0
 * @category Native controls
 */
export const Checkbox = Input;
