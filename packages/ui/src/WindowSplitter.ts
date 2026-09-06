import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html, liftRenderableToFx, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { ComposedRef } from "./Dom/Refs.js";
import type { HostResult } from "./Dom/Types.js";

/** Visual orientation of the separator between panes.
 * @remarks
 * A vertical separator adjusts with Left/Right; a horizontal separator adjusts
 * with Up/Down, matching the axis perpendicular to the dividing line.
 * @since 1.0.0
 * @category Resize axis
 */
export type Orientation = "horizontal" | "vertical";

/** Current value and keyboard policy for a window splitter.
 * @remarks
 * All range and collapse information remains renderer-independent and directly
 * testable.
 * Plain state retains no resources; its hydrated RefSubject is Scope-owned.
 * @since 1.0.0
 * @category Pane sizing state
 */
export interface State {
  /** Current pane size value.
   * @remarks
   * It drives `aria-valuenow` and keyboard adjustments.
   * @since 1.0.0
   * @category Current value
   */
  readonly value: number;
  /** Restore value used by `toggleCollapsed`.
   * @remarks
   * It starts at the initial clamped value. `toggleCollapsed` overwrites it only
   * when collapsing from a non-minimum value, then reads it when restoring.
   * Ordinary `setValue` and `adjust` calls do not update it.
   * @since 1.0.0
   * @category Collapse and restore
   */
  readonly previousValue: number;
  /** Inclusive minimum pane value.
   * @remarks
   * Updates clamp to this bound and Home jumps to it.
   * @since 1.0.0
   * @category Range constraints
   */
  readonly min: number;
  /** Inclusive maximum pane value.
   * @remarks
   * Updates clamp to this bound and End jumps to it.
   * @since 1.0.0
   * @category Range constraints
   */
  readonly max: number;
  /** Keyboard adjustment increment.
   * @remarks
   * Arrow keys require a deterministic application-defined change size. The
   * state constructor does not enforce positivity; callers must provide a
   * positive value for conventional keyboard direction.
   * @since 1.0.0
   * @category Keyboard adjustment
   */
  readonly step: number;
  /** Separator orientation and keyboard axis.
   * @remarks
   * The value drives both `aria-orientation` and valid arrow keys.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation: Orientation;
}

/** Initial splitter range and keyboard configuration.
 * @remarks
 * Defaults give the widget a complete deterministic state before rendering.
 * Callers remain responsible for `min <= max` and `step > 0`.
 * @since 1.0.0
 * @category Pane sizing state
 */
export interface InitialState {
  /** Initial pane size, clamped to min/max.
   * @remarks
   * Invalid out-of-range starts become a valid accessible value.
   * @since 1.0.0
   * @category Current value
   */
  readonly value: number;
  /** Minimum value, defaulting to zero.
   * @remarks
   * It defines the collapsed boundary and Home result. Callers must ensure it is
   * less than or equal to `max`; neither the schema nor constructor compares them.
   * @since 1.0.0
   * @category Range constraints
   */
  readonly min?: number;
  /** Maximum value, defaulting to one hundred.
   * @remarks
   * It defines the upper keyboard and ARIA bound. Callers must ensure it is
   * greater than or equal to `min`; neither the schema nor constructor compares them.
   * @since 1.0.0
   * @category Range constraints
   */
  readonly max?: number;
  /** Arrow-key increment, defaulting to ten.
   * @remarks
   * The widget needs an explicit adjustment granularity. Callers must provide a
   * positive value; `Schema.Finite` rejects infinities and NaN but accepts zero
   * and negative numbers.
   * @since 1.0.0
   * @category Keyboard adjustment
   */
  readonly step?: number;
  /** Separator orientation, defaulting to vertical.
   * @remarks
   * Orientation determines ARIA output and arrow-key mapping.
   * @since 1.0.0
   * @category Keyboard navigation
   */
  readonly orientation?: Orientation;
}

/** Schema for the structural splitter hydration state.
 * @remarks
 * It validates finite numeric fields and the orientation union. It does not
 * enforce `min <= max`, a positive `step`, or any relationship among fields;
 * callers must satisfy those semantic preconditions.
 * @since 1.0.0
 * @category Pane sizing state
 */
export const StateSchema = Schema.Struct({
  value: Schema.Finite,
  previousValue: Schema.Finite,
  min: Schema.Finite,
  max: Schema.Finite,
  step: Schema.Finite,
  orientation: Schema.Literals(["horizontal", "vertical"]),
});

/** Creates hydrated splitter state and clamps the initial value.
 * @remarks
 * Pane sizing behavior can be composed and tested without mounting a separator.
 * Callers must supply `min <= max` and `step > 0`; the constructor defaults
 * omitted bounds/step but does not validate those relationships.
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   return yield* WindowSplitter.makeState({ value: 320, min: 180, max: 640 })
 * })
 * ```
 * @since 1.0.0
 * @category Pane sizing state
 */
export function makeState(initial: InitialState) {
  const min = initial.min ?? 0;
  const max = initial.max ?? 100;
  const value = clamp(initial.value, min, max);
  return RefSubject.hydrate(StateSchema, {
    value,
    previousValue: value,
    min,
    max,
    step: initial.step ?? 10,
    orientation: initial.orientation ?? "vertical",
  });
}

/** Sets and clamps the current splitter value.
 * @remarks
 * All callers share one transition bounded by the state's `min` and `max`.
 * Correct range ordering remains a caller precondition. This operation does not
 * change `previousValue`.
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320 })
 *   yield* WindowSplitter.setValue(state, 400)
 * })
 * ```
 * @since 1.0.0
 * @category Bounded resizing
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(value, current.min, current.max),
  }));
}

/** Adds a delta and clamps the resulting splitter value.
 * @remarks
 * Arrow-key behavior can be tested independently of DOM events. Correct range
 * ordering remains a caller precondition, and this operation does not change
 * `previousValue`.
 * The Effect uses the existing RefSubject lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320, step: 24 })
 *   yield* WindowSplitter.adjust(state, 24)
 * })
 * ```
 * @since 1.0.0
 * @category Bounded resizing
 */
export function adjust<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  delta: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    value: clamp(current.value + delta, current.min, current.max),
  }));
}

/** Collapses to min or restores the recorded collapse value.
 * @remarks
 * When the current value is not `min`, the operation records that exact value in
 * `previousValue` and collapses. At `min`, it restores the stored value after
 * clamping it to the current range. Other updates do not maintain a history.
 * The Effect updates existing state atomically and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320 })
 *   yield* WindowSplitter.toggleCollapsed(state)
 * })
 * ```
 * @since 1.0.0
 * @category Collapse and restore
 */
export function toggleCollapsed<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) =>
    current.value === current.min
      ? { ...current, value: clamp(current.previousValue, current.min, current.max) }
      : { ...current, previousValue: current.value, value: current.min },
  );
}

/** Options for the focusable ARIA window splitter.
 * @remarks
 * The model connects renderer-independent sizing to its controlled pane and
 * accessible range metadata. Its state must already satisfy `min <= max` and a
 * positive `step`; the component does not repair invalid state.
 * Options are inert; rendering owns subscriptions/listeners by Scope.
 * @since 1.0.0
 * @category Resize separator
 */
export interface WindowSplitterOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Hydrated sizing state.
   * @remarks
   * One source drives keyboard updates and every ARIA range attribute.
   * The splitter borrows state; its original Scope owns it.
   * @since 1.0.0
   * @category State connection
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Id of the pane controlled by the splitter.
   * @remarks
   * `aria-controls` makes the resizing relationship explicit.
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category Identity and relationships
   */
  readonly primaryPaneId: Renderable.Any<string | null | undefined>;
  /** Accessible name when no external label is supplied.
   * @remarks
   * A focusable separator needs a discoverable purpose.
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category Accessible naming
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /** Human-readable value text supplementing the number.
   * @remarks
   * Pane sizes such as percentages or labels may be clearer than raw values.
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category Accessible value text
   */
  readonly valueText?: Renderable.Any<string | null | undefined>;
  /** State-value units represented by one CSS pixel of pointer movement.
   * @remarks
   * By default, the usable parent width (vertical separator) or height
   * (horizontal separator), minus the separator thickness, represents 100
   * units. This matches percentage pane sizes. Set `1` for CSS-pixel values.
   * Positive axis-aligned CSS scaling is accounted for; pointer coordinates
   * are converted from viewport pixels to the parent's CSS-pixel scale.
   * Supply a positive finite number when using another unit system.
   * Keyboard step and min/max remain independent of pointer resolution.
   * @since 1.0.0
   * @category Pointer resizing
   */
  readonly valuePerPixel?: number;
  /** Whether keyboard and pointer adjustments are disabled.
   * @remarks
   * ARIA disabled state and handler behavior must agree.
   * Dynamic values follow the component Scope.
   * @since 1.0.0
   * @category Availability
   */
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
}

function internalProps<const Options extends WindowSplitterOptions>(
  options: Options,
): (helpers: Dom.InternalPropsHelpers<Options>) => WindowSplitterInternalProps<Options> {
  const drags = new WeakMap<HTMLElement, {
    readonly pointerId: number;
    readonly coordinate: number;
    readonly value: number;
    readonly orientation: Orientation;
    readonly scale: number;
  }>();
  const release = (element: HTMLElement) => {
    const drag = drags.get(element);
    drags.delete(element);
    if (drag !== undefined && element.hasPointerCapture(drag.pointerId)) {
      element.releasePointerCapture(drag.pointerId);
    }
  };
  const pointerRef = Effect.fn(function* (element: HTMLDivElement) {
    yield* Scope.addFinalizer(yield* Effect.scope, Effect.sync(() => {
      release(element);
    }));
  });
  const pointerStyle: Fx.Fx<
    string | Partial<CSSStyleDeclaration>,
    Renderable.Error<Options>,
    Renderable.Services<Options>
  > = liftRenderableToFx<Renderable.Error<Options>, Renderable.Services<Options>>(
    options.props?.style,
  ).pipe(Fx.map((style: string | Partial<CSSStyleDeclaration> | null | undefined): string | Partial<CSSStyleDeclaration> => {
    if (typeof style === "string") return `${style};touch-action:none;`;
    if (typeof style?.cssText === "string") return `${style.cssText};touch-action:none;`;
    return { ...style, touchAction: "none" };
  }));
  const onpointerdown = EventHandler.make((event: PointerEvent) => Effect.sync(() => {
    const element = Dom.currentTarget<HTMLElement>(event);
    if (event.button !== 0 || !event.isPrimary || element.getAttribute("aria-disabled") === "true") return;
    if (drags.has(element)) return;
    // The visible ARIA snapshot starts the native gesture without yielding to
    // state acquisition before preventDefault and pointer capture.
    const valueAttribute = element.getAttribute("aria-valuenow");
    const value = Number(valueAttribute);
    const orientation = element.getAttribute("aria-orientation");
    if (valueAttribute === null || !Number.isFinite(value)) return;
    const parent = element.parentElement;
    if (parent === null) return;
    const vertical = orientation === "vertical";
    const parentRect = parent.getBoundingClientRect();
    const separatorRect = element.getBoundingClientRect();
    // Pointer coordinates and DOMRects use viewport pixels. Convert the
    // parent's client extent to that same unit, excluding its border/scrollbar.
    const axisScale = vertical
      ? parentRect.width / parent.offsetWidth
      : parentRect.height / parent.offsetHeight;
    if (!Number.isFinite(axisScale) || axisScale <= 0) return;
    const extent = vertical
      ? parent.clientWidth * axisScale - separatorRect.width
      : parent.clientHeight * axisScale - separatorRect.height;
    const scale = options.valuePerPixel === undefined
      ? 100 / extent
      : options.valuePerPixel / axisScale;
    if (!Number.isFinite(scale) || scale <= 0) return;
    event.preventDefault();
    element.focus();
    element.setPointerCapture(event.pointerId);
    drags.set(element, {
      pointerId: event.pointerId,
      coordinate: vertical ? event.clientX : event.clientY,
      value,
      orientation: vertical ? "vertical" : "horizontal",
      scale,
    });
  }));
  const onpointermove = EventHandler.make(Effect.fn(function* (event: PointerEvent) {
    const element = Dom.currentTarget<HTMLElement>(event);
    const drag = drags.get(element);
    if (drag === undefined || drag.pointerId !== event.pointerId) return;
    if (element.getAttribute("aria-disabled") === "true" || (event.buttons & 1) === 0) {
      release(element);
      return;
    }
    event.preventDefault();
    const coordinate = drag.orientation === "vertical" ? event.clientX : event.clientY;
    yield* setValue(options.state, drag.value + (coordinate - drag.coordinate) * drag.scale);
  }));
  const endDrag = EventHandler.make((event: PointerEvent) => Effect.sync(() => {
    const element = Dom.currentTarget<HTMLElement>(event);
    if (drags.get(element)?.pointerId === event.pointerId) release(element);
  }));
  const onkeydown = EventHandler.make(
    Effect.fn(function* (event: KeyboardEvent) {
      const current = yield* options.state;
      if (Dom.currentTarget<HTMLElement>(event).getAttribute("aria-disabled") === "true") {
        return current;
      }
      const delta = keyDelta(event.key, current);
      if (delta !== undefined) {
        event.preventDefault();
        return yield* adjust(options.state, delta);
      }
      if (event.key === "Home") {
        event.preventDefault();
        return yield* setValue(options.state, current.min);
      }
      if (event.key === "End") {
        event.preventDefault();
        return yield* setValue(options.state, current.max);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        return yield* toggleCollapsed(options.state);
      }
      return current;
    }),
  );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "separator",
      style: pointerStyle,
      tabindex: 0,
      "aria-orientation": RefSubject.map(options.state, (state) => state.orientation),
      "aria-valuenow": RefSubject.map(options.state, (state) => state.value),
      "aria-valuemin": RefSubject.map(options.state, (state) => state.min),
      "aria-valuemax": RefSubject.map(options.state, (state) => state.max),
      "aria-controls": property("primaryPaneId", undefined),
      "aria-label": property("label", undefined),
      "aria-valuetext": property("valueText", undefined),
      "aria-disabled": property("disabled", false),
      onkeydown,
      onpointerdown,
      onpointermove,
      onpointerup: endDrag,
      onpointercancel: endDrag,
      onlostpointercapture: endDrag,
      ref: Dom.composeRefs(options.state, pointerRef),
    }) as const;
}
type WindowSplitterInternalProps<Options extends WindowSplitterOptions> = {
  readonly role: "separator";
  readonly style: Fx.Fx<string | Partial<CSSStyleDeclaration>, Renderable.Error<Options>, Renderable.Services<Options>>;
  readonly tabindex: 0;
  readonly "aria-orientation": RefSubject.Computed<Orientation, Schema.SchemaError>;
  readonly "aria-valuenow": RefSubject.Computed<number, Schema.SchemaError>;
  readonly "aria-valuemin": RefSubject.Computed<number, Schema.SchemaError>;
  readonly "aria-valuemax": RefSubject.Computed<number, Schema.SchemaError>;
  readonly "aria-controls": Dom.NonNullish<Dom.Property<Options, "primaryPaneId">> | undefined;
  readonly "aria-label": Dom.NonNullish<Dom.Property<Options, "label">> | undefined;
  readonly "aria-valuetext": Dom.NonNullish<Dom.Property<Options, "valueText">> | undefined;
  readonly "aria-disabled": Dom.NonNullish<Dom.Property<Options, "disabled">> | false;
  readonly onkeydown: EventHandler.EventHandler<KeyboardEvent, Schema.SchemaError>;
  readonly onpointerdown: EventHandler.EventHandler<PointerEvent>;
  readonly onpointermove: EventHandler.EventHandler<PointerEvent, Schema.SchemaError>;
  readonly onpointerup: EventHandler.EventHandler<PointerEvent>;
  readonly onpointercancel: EventHandler.EventHandler<PointerEvent>;
  readonly onlostpointercapture: EventHandler.EventHandler<PointerEvent>;
  readonly ref: ComposedRef<
    RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
    (element: HTMLDivElement) => Effect.Effect<void, never, Scope.Scope>
  > | undefined;
};

/** Renders a focusable ARIA separator for resizing a pane.
 * @remarks
 * The component exposes native DOM focus/events and the ARIA window-splitter
 * range contract: arrows adjust by step, Home/End reach bounds, and Enter
 * collapses/restores. Pointer dragging adjusts the same clamped state, using
 * percentage-of-parent movement by default or the supplied `valuePerPixel`.
 * Native pointer capture keeps movement attached outside the separator;
 * release, cancellation, lost capture, and Scope teardown end the drag.
 * The host composes caller styles with `touch-action: none` so touch gestures
 * remain resize interactions. The caller binds state to actual pane layout. Disabled state
 * leaves keyboard and pointer activation inert.
 * Running the returned Fx owns real key listeners, reactive ARIA attributes,
 * and the hydration ref in its Effect Scope. A custom host must preserve role,
 * tab index, range/relationship attributes, handler, and one hydration owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as WindowSplitter from "@typed/ui/WindowSplitter"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* WindowSplitter.makeState({ value: 320, min: 180, max: 640 })
 *   return WindowSplitter.WindowSplitter({ state, primaryPaneId: "navigation" })
 * })
 * ```
 * @since 1.0.0
 * @category Resize separator
 */
export function WindowSplitter<
  const Options extends WindowSplitterOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, WindowSplitterInternalProps<Options>>,
    "",
    Host
  >,
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    WindowSplitterInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<div ...${props}></div>`;
  });
}

function keyDelta(key: string, state: State): number | undefined {
  if (state.orientation === "vertical") {
    if (key === "ArrowLeft") return -state.step;
    if (key === "ArrowRight") return state.step;
    return undefined;
  }
  if (key === "ArrowUp") return -state.step;
  if (key === "ArrowDown") return state.step;
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
