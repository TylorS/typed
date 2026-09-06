/**
 * Native range input publishing numeric updates during input.
 * Keep programmatic values coherent with bounds and control expensive downstream work separately.
 *
 * Read the [Slider guide](/explore/ui-slider) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/slider/).
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
 * Creates hydrated slider state.
 * @remarks
 * State can be composed and tested independently of the renderer.
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Slider from "@typed/ui/Slider"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Slider.makeState({ value: 50 })
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/**
 * Assigns a range value without clamping or snapping it.
 *
 * @remarks
 * min, max, and step belong to the native input options and are not consulted here. Validate or
 * normalize programmatic values before assignment so the subject and browser-sanitized range
 * value stay consistent.
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
export interface SliderOptions extends Dom.HostOptions<HTMLInputElement> {
  /**
   * Hydrated state synchronized to the input.
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

function internalProps<const Options extends SliderOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "range",
      value: RefSubject.map(options.state, (state) => state.value),
      ".value": RefSubject.map(options.state, (state) => String(state.value)),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      oninput: EventHandler.make(
        Effect.fn((event: Event) =>
          setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
        ),
      ),
      ref: options.state,
    }) as const;
}
type SliderInternalProps<Options extends SliderOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/**
 * Renders a native range input whose input events update numeric state.
 *
 * @remarks
 * Dragging publishes through input, so expensive downstream work should control its own update
 * rate. Native min/max/step, keyboard interaction, and pointer behavior stay with the browser.
 * Supply a label and a unit-bearing readout; a custom non-input host must implement the
 * interaction itself.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as Slider from "@typed/ui/Slider";
 *
 * export const ZoomControl = component(function* () {
 *   const state = yield* Slider.makeState({ value: 100 });
 *   const percentage = RefSubject.map(state, ({ value }) => `${value}%`);
 *   return html`<div class="zoom-control">
 *     <label for="preview-zoom">Preview zoom</label>
 *     ${Slider.Slider({
 *       state, min: 50, max: 200, step: 10,
 *       props: { id: "preview-zoom", name: "zoom", "aria-valuetext": percentage },
 *     })}
 *     <output for="preview-zoom">${percentage}</output>
 *   </div>`;
 * });
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function Slider<const Options extends SliderOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SliderInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SliderInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
