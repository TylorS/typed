/**
 * Native number entry publishing valueAsNumber at the change boundary.
 * This thin primitive does not maintain draft strings or filter invalid numeric writes.
 *
 * Read the [SpinButton guide](/explore/ui-spin-button) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 */
export interface State {
  /**
   */
  readonly value: number;
}

/**
 */
export interface InitialState {
  /**
   */
  readonly value: number;
}

/**
 */
export const StateSchema = Schema.Struct({ value: Schema.Finite });

/**
 * Creates hydrated spin-button state.
 * @remarks
 * State remains renderer-independent and directly testable.
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as SpinButton from "@typed/ui/SpinButton"
 *
 * const program = Effect.gen(function* () {
 *   return yield* SpinButton.makeState({ value: 3 })
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/**
 * Assigns a numeric value without bounds checks or draft filtering.
 *
 * @remarks
 * The helper does not consult min/max/step or reject NaN. The hydration schema describes finite
 * snapshots, but this update is not a decoder. Choose Form.NumberInput or an explicit draft
 * model when invalid text needs structured feedback.
 * @since 1.0.0
 * @category State transitions
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

/**
 */
export interface SpinButtonOptions extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Hydrated value state.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Native minimum value.
   * @since 1.0.0
   * @category Numeric bounds
   */
  readonly min?: Renderable.Any<number | null | undefined>;
  /**
   * Native maximum value.
   * @since 1.0.0
   * @category Numeric bounds
   */
  readonly max?: Renderable.Any<number | null | undefined>;
  /**
   * Native step value or `"any"`.
   * @since 1.0.0
   * @category Numeric bounds
   */
  readonly step?: Renderable.Any<number | "any" | null | undefined>;
}

function internalProps<const Options extends SpinButtonOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "number",
      value: RefSubject.map(options.state, (state) => state.value),
      ".value": RefSubject.map(options.state, (state) => String(state.value)),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      onchange: EventHandler.make(
        Effect.fn((event: Event) =>
          setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
        ),
      ),
      ref: options.state,
    }) as const;
}
type SpinButtonInternalProps<Options extends SpinButtonOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/**
 * Renders a native number input that writes valueAsNumber on change.
 *
 * @remarks
 * State updates occur at the change boundary rather than every input event. Empty or invalid
 * native text can yield NaN; the handler does not filter it before assignment. This thin
 * primitive does not preserve a separate draft string, create field errors, or clamp
 * programmatic writes.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as SpinButton from "@typed/ui/SpinButton";
 *
 * export const CopyCount = component(function* () {
 *   const state = yield* SpinButton.makeState({ value: 1 });
 *   const summary = RefSubject.map(state, ({ value }) => `Copies requested: ${value}`);
 *   return html`<div class="copy-count">
 *     <label for="print-copies">Number of copies</label>
 *     ${SpinButton.SpinButton({
 *       state, min: 1, max: 100, step: 1,
 *       props: { id: "print-copies", name: "copies", required: true },
 *     })}
 *     <p>${summary}</p>
 *   </div>`;
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function SpinButton<
  const Options extends SpinButtonOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SpinButtonInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SpinButtonInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
