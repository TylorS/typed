/**
 * A non-interactive native measurement within a known range.
 * Threshold options communicate preferred regions; they do not execute alert policies.
 *
 * Read the [Meter guide](/explore/ui-meter) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).
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
 * Creates hydrated meter state.
 * @remarks
 * The state remains testable and reusable without rendering a UI component.
 * The caller's Effect Scope owns the hydrated RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Meter from "@typed/ui/Meter"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Meter.makeState({ value: 0.72 })
 * })
 * ```
 * @since 1.0.0
 * @category State construction
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/**
 * Assigns the displayed measurement without clamping it to the meter range.
 *
 * @remarks
 * Keep measurement units consistent with min/max and threshold options. This operation does not
 * execute threshold actions or validate the preferred range.
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
export interface MeterOptions extends Dom.HostOptions<HTMLMeterElement> {
  /**
   * Hydrated value state borrowed by the element.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /**
   * Lower bound of the measured range.
   * @since 1.0.0
   * @category Numeric bounds
   */
  readonly min?: Renderable.Any<number | null | undefined>;
  /**
   * Upper bound of the measured range.
   * @since 1.0.0
   * @category Numeric bounds
   */
  readonly max?: Renderable.Any<number | null | undefined>;
  /**
   * Boundary below which values are considered low.
   * @since 1.0.0
   * @category Measurement thresholds
   */
  readonly low?: Renderable.Any<number | null | undefined>;
  /**
   * Boundary above which values are considered high.
   * @since 1.0.0
   * @category Measurement thresholds
   */
  readonly high?: Renderable.Any<number | null | undefined>;
  /**
   * Preferred value within the meter range.
   * @since 1.0.0
   * @category Measurement thresholds
   */
  readonly optimum?: Renderable.Any<number | null | undefined>;
  /**
   * Fallback content rendered inside the meter.
   * @since 1.0.0
   * @category Rendered content
   */
  readonly content?: Renderable.Any;
}

function internalProps<const Options extends MeterOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      value: RefSubject.map(options.state, (state) => state.value),
      min: property("min", undefined),
      max: property("max", undefined),
      low: property("low", undefined),
      high: property("high", undefined),
      optimum: property("optimum", undefined),
      ref: options.state,
    }) as const;
}
type MeterInternalProps<Options extends MeterOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/**
 * Renders a native meter for a measurement within a known range.
 *
 * @remarks
 * Supply a label and coherent min/max/low/high/optimum values. The browser presents thresholds;
 * the component does not trigger alerts when they are crossed. Use a slider for editing or a
 * progress element for operation completion. The meter has no keyboard action.
 *
 * @example
 * ```ts
 * import { RefSubject } from "@typed/fx";
 * import { html } from "@typed/template";
 * import { component } from "@typed/ui/Component";
 * import * as Meter from "@typed/ui/Meter";
 *
 * export const StorageUsage = component(function* () {
 *   const state = yield* Meter.makeState({ value: 64 });
 *   const description = RefSubject.map(state, ({ value }) => `${value} GB of 100 GB used`);
 *   return html`<section>
 *     <label for="storage-meter">Storage used</label>
 *     ${Meter.Meter({
 *       state, min: 0, max: 100, low: 60, high: 85, optimum: 0,
 *       content: description,
 *       props: { id: "storage-meter", "aria-valuetext": description },
 *     })}
 *     <p>${description}</p>
 *   </section>`;
 * });
 * ```
 * @since 1.0.0
 * @category Controls
 */
export function Meter<const Options extends MeterOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, MeterInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLMeterElement>()<
    Options,
    MeterInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, internalProps(options), options.content ?? "", (props, content) => {
    return html`<meter ...${props}>${content}</meter>`;
  });
}
