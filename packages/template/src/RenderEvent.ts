import { hasProperty } from "effect/Predicate";
import { type Rendered, toHtml } from "./Wire.js";

/**
 * Represents the result of a rendering operation.
 * Can be either a DOM-based event (containing actual Nodes) or an HTML-based event (containing strings).
 *
 * @remarks
 * ## Why
 *
 * `RenderEvent` is the small output boundary shared by Typed renderers. Once a
 * producer exposes `Fx<RenderEvent, E, R>`, DOM templates, streamed SSR, routers,
 * and external renderers compose without a virtual component-tree protocol.
 * The Fx still carries every failure and required Effect service.
 *
 * ## Ownership and lifetime
 *
 * A RenderEvent transports output; it does not acquire or retain the producer.
 * The producing Fx and its running Effect `Scope` own subscriptions,
 * interruption, ordering, and finalization. A consumer owns only the DOM range
 * or HTML stream position to which it applies the event.
 *
 * ## Representation
 *
 * `DomRenderEvent` preserves existing DOM identity. `HtmlRenderEvent` carries
 * trusted renderer-owned HTML chunks for server output. Consumers can branch on
 * the public discriminant without hidden renderer state. DOM handler events are
 * a separate concern and use EventSource's documented forwarding `Proxy`.
 *
 * @example
 * ```ts
 * import { html } from "@typed/template"
 * import {
 *   isDomRenderEvent,
 *   isHtmlRenderEvent
 * } from "@typed/template/RenderEvent"
 * import { Fx } from "@typed/fx"
 * import { Option } from "effect"
 *
 * const template = html`<div>Hello</div>`;
 *
 * // Render events are emitted by the template Fx
 * const program = Fx.gen(function* () {
 *   const maybeEvent = yield* Fx.first(template);
 *
 *   return Option.match(maybeEvent, {
 *     onNone: () => Fx.empty,
 *     onSome: (event) => {
 *       if (isDomRenderEvent(event)) {
 *         const nodes = event.valueOf();
 *         console.log(nodes);
 *       } else if (isHtmlRenderEvent(event)) {
 *         const html = event.toString();
 *         console.log(html);
 *       }
 *
 *       // Fx.gen setup must return the Fx that runs afterward.
 *       return Fx.succeed(event);
 *     },
 *   });
 * });
 * ```
 *
 * @since 1.0.0
 * @category Renderer output protocol
 */
export type RenderEvent = DomRenderEvent | HtmlRenderEvent;

/**
 * The global discriminant key shared by DOM and HTML render events.
 *
 * @remarks
 * ## Why
 *
 * One nominal key supports cross-module guards without a component protocol.
 *
 * ## Ownership and lifetime
 *
 * The symbol is process-global metadata and owns no rendered output.
 *
 * @example
 * ```ts
 * import { RenderEventTypeId } from "@typed/template/RenderEvent"
 *
 * const key = RenderEventTypeId
 * ```
 *
 * @since 1.0.0
 * @category Renderer output protocol
 */
export const RenderEventTypeId = Symbol.for("@typed/template/RenderEvent");

/**
 * The nominal type of `RenderEventTypeId`.
 *
 * @remarks
 * ## Why
 *
 * This type carries the exact discriminant key through public interfaces.
 *
 * ## Ownership and lifetime
 *
 * It is compile-time metadata with no runtime lifetime.
 *
 * @example
 * ```ts
 * import { RenderEventTypeId, type RenderEventTypeId as Id } from "@typed/template/RenderEvent"
 *
 * const id: Id = RenderEventTypeId
 * ```
 *
 * @since 1.0.0
 * @category Renderer output protocol
 */
export type RenderEventTypeId = typeof RenderEventTypeId;

/**
 * The published advanced brand identifying renderer-owned HTML transport.
 *
 * @remarks
 * ## Why
 *
 * The separate brand prevents arbitrary `toString` objects from crossing the
 * trusted SSR boundary as raw markup.
 *
 * ## Ownership and lifetime
 *
 * The symbol is global metadata; it does not validate, sanitize, or retain HTML.
 *
 * @example
 * ```ts
 * import { HtmlRenderEvent, HtmlRenderTransportBrand } from "@typed/template/RenderEvent"
 *
 * const event = HtmlRenderEvent("<p>trusted renderer output</p>", true)
 * event[HtmlRenderTransportBrand] // true
 * ```
 *
 * @since 1.0.0
 * @category HTML transport trust
 * @stability internal-but-published
 */
export const HtmlRenderTransportBrand = Symbol.for("@typed/template/HtmlRenderTransportBrand");

/**
 * A RenderEvent containing DOM nodes.
 *
 * @remarks
 * ## Why
 *
 * `DomRenderEvent` lets any renderer hand Typed an existing `Node`,
 * `DocumentFragment`, `Wire`, or nested readonly collection of those values.
 * The exact objects cross the boundary: Typed does not recreate them, rewrite
 * their classes, or claim siblings and ancestors owned by another system.
 *
 * ## Ownership and lifetime
 *
 * The event owns no surrounding DOM and establishes no subscription. The Fx
 * that emitted it owns external-renderer teardown and Effect finalizers. The
 * receiving dynamic part may insert, remove, or move only the nodes represented
 * by the event inside that part's bounded range.
 *
 * ## DOM behavior
 *
 * Browser-owned state stays attached to the same node identity. Delegated event
 * handlers use EventSource's documented forwarding Proxy with an overridden
 * `currentTarget`; the DOM nodes themselves are not recreated. When an
 * already-connected node must move, the renderer prefers
 * `ParentNode.moveBefore` and falls back to `insertBefore`.
 *
 * @example
 * ```ts
 * import { DomRenderEvent } from "@typed/template/RenderEvent"
 *
 * const node = document.createElement("div")
 * const event = DomRenderEvent(node)
 *
 * // Get the DOM node
 * const domNode = event.valueOf()
 *
 * // Convert to HTML string
 * const htmlString = event.toString()
 * ```
 *
 * @since 1.0.0
 * @category Native DOM output
 */
export interface DomRenderEvent {
  /** Native-output discriminant stored at the public RenderEvent key.
   *
   * @remarks
   * ## Why
   * Distinguishes exact-node output from HTML transport.
   *
   * ## Ownership and lifetime
   * Immutable metadata owned by the event record.
   *
   * @since 1.0.0
   * @category Native DOM output
   */
  readonly [RenderEventTypeId]: "dom";
  /**
   * The actual rendered DOM content.
   *
   * @remarks
   * ## Why
   * Exposes exact nodes rather than a virtual representation.
   *
   * ## Ownership and lifetime
   * The event retains these nodes; producer and receiving range define teardown.
   *
   * @since 1.0.0
   * @category Native DOM output
   */
  readonly content: Rendered;
  /** Serializes the current nodes for diagnostics or non-streaming integration.
   *
   * @remarks
   * ## Why
   * Provides a string representation without discarding DOM identity.
   *
   * ## Ownership and lifetime
   * Reads the nodes and performs no mutation.
   *
   * @since 1.0.0
   * @category DOM serialization
   */
  readonly toString: () => string;
  /** Returns the exact DOM value carried by the event.
   *
   * @remarks
   * ## Why
   * Integrations can insert or inspect the original nodes.
   *
   * ## Ownership and lifetime
   * Returns a borrowed identity; it does not clone or transfer ownership.
   *
   * @since 1.0.0
   * @category Native DOM output
   */
  readonly valueOf: () => Rendered;
}

/**
 * Creates a `DomRenderEvent`.
 *
 * @remarks
 * ## Why
 *
 * Any integration can expose concrete DOM output to Typed without pretending
 * its mount operation returns an Fx. The integration may emit this event from
 * whatever Fx correctly models its own update and teardown lifecycle.
 *
 * ## Ownership and lifetime
 *
 * Construction retains the exact node objects but acquires no external
 * renderer. The producer remains responsible for teardown; Typed only manages
 * insertion within the receiving dynamic range.
 *
 * @example
 * ```ts
 * import { DomRenderEvent } from "@typed/template/RenderEvent"
 *
 * const div = document.createElement("div")
 * div.textContent = "Hello"
 * const event = DomRenderEvent(div)
 * ```
 *
 * @since 1.0.0
 * @category Native DOM output
 */
export const DomRenderEvent = (content: Rendered): DomRenderEvent => ({
  [RenderEventTypeId]: "dom",
  content,
  toString: () => toHtml(content),
  valueOf: () => content,
});

/**
 * A RenderEvent containing an HTML string.
 *
 * @remarks
 * ## Why
 *
 * `HtmlRenderEvent` allows an HTML-producing renderer or stream to join Typed's
 * ordered SSR output without pretending its chunks are DOM nodes. This is the
 * HTML counterpart to `DomRenderEvent`, not a framework-specific adapter.
 *
 * ## Ownership and lifetime
 *
 * The producing Fx owns chunk order, interruption, resource finalization, and
 * the decision to mark the final event. `last` is `true` only for the terminal
 * chunk. The event itself retains only its string and completion marker.
 *
 * ## Trust boundary
 *
 * The HTML is branded renderer-owned transport. It is not sanitized and must
 * never be constructed from arbitrary application or user data. Ordinary
 * `html` template interpolations remain escaped; only a renderer that already
 * owns safe HTML serialization should call this constructor.
 *
 * @example
 * ```ts
 * import { HtmlRenderEvent } from "@typed/template/RenderEvent"
 *
 * const event = HtmlRenderEvent("<div>Hello</div>", true)
 *
 * // Get the HTML string
 * const html = event.toString()
 *
 * // Check if it's the last chunk
 * if (event.last) {
 *   console.log("Final chunk")
 * }
 * ```
 *
 * @since 1.0.0
 * @category Serialized HTML output
 */
export interface HtmlRenderEvent {
  /** HTML-output discriminant stored at the public RenderEvent key.
   *
   * @remarks
   * ## Why
   * Separates server strings from DOM output.
   *
   * ## Ownership and lifetime
   * Immutable metadata owned by the event.
   *
   * @since 1.0.0
   * @category Serialized HTML output
   */
  readonly [RenderEventTypeId]: "html";
  /** Evidence that the string came from a renderer-owned serialization path.
   *
   * @remarks
   * ## Why
   * Rejects structurally similar raw application objects at runtime.
   *
   * ## Ownership and lifetime
   * Immutable metadata; it does not sanitize or retain another value.
   *
   * @since 1.0.0
   * @category Serialized HTML output
   */
  readonly [HtmlRenderTransportBrand]: true;
  /**
   * The rendered HTML string.
   *
   * @remarks
   * ## Why
   * Carries one ordered output chunk without pretending it is DOM.
   *
   * ## Ownership and lifetime
   * The event owns the string; the producer owns stream ordering and cleanup.
   *
   * @since 1.0.0
   * @category Serialized HTML output
   */
  readonly html: string;
  /**
   * Indicates if this is the last part of a chunked render.
   *
   * @remarks
   * ## Why
   * Ordered consumers can finalize one logical render without inspecting content.
   *
   * ## Ownership and lifetime
   * Immutable producer-supplied metadata.
   *
   * @since 1.0.0
   * @category HTML chunk completion
   */
  readonly last: boolean;
  /** Returns the HTML chunk for string-oriented consumers.
   *
   * @remarks
   * ## Why
   * Integrates with ordinary serialization protocols.
   *
   * ## Ownership and lifetime
   * Returns the event-owned immutable string.
   *
   * @since 1.0.0
   * @category Serialized HTML output
   */
  readonly toString: () => string;
  /** Returns the HTML chunk as the event's primitive value.
   *
   * @remarks
   * ## Why
   * Keeps HTML transport ergonomic without weakening its brand.
   *
   * ## Ownership and lifetime
   * Returns the event-owned immutable string.
   *
   * @since 1.0.0
   * @category Serialized HTML output
   */
  readonly valueOf: () => string;
}

/**
 * Creates renderer-owned HTML transport for custom integrations.
 *
 * This is not an application sanitization or raw-markup API. Ordinary template
 * data must not call this constructor; use trusted renderer pipelines instead.
 *
 * @remarks
 * ## Why
 *
 * HTML-producing streams can participate in ordered Typed SSR without being
 * converted to DOM or tied to a framework-specific integration API.
 *
 * ## Ownership and lifetime
 *
 * The constructor only records a chunk and terminal flag. The producing Fx owns
 * ordering, interruption, errors, services, and cleanup.
 *
 * ## Trust boundary
 *
 * No sanitization occurs. Only code that already owns correct HTML serialization
 * should construct this event; application data belongs in escaped `html` parts.
 *
 * @example
 * ```ts
 * import { HtmlRenderEvent } from "@typed/template/RenderEvent"
 *
 * // Create a single-chunk HTML event
 * const event = HtmlRenderEvent("<div>Hello</div>", true)
 *
 * // Create a multi-chunk HTML event
 * const chunk1 = HtmlRenderEvent("<div>", false)
 * const chunk2 = HtmlRenderEvent("Hello", false)
 * const chunk3 = HtmlRenderEvent("</div>", true)
 * ```
 *
 * @since 1.0.0
 * @category Serialized HTML output
 */
export const HtmlRenderEvent = (html: string, last: boolean): HtmlRenderEvent => ({
  [RenderEventTypeId]: "html",
  [HtmlRenderTransportBrand]: true,
  html,
  last,
  toString: () => html,
  valueOf: () => html,
});

/**
 * Checks if a value is a `RenderEvent`.
 *
 * @remarks
 * ## Why
 *
 * Renderable lifting needs a nominal branch for already-rendered output.
 *
 * ## Ownership and lifetime
 *
 * The guard only inspects the discriminant and retains nothing.
 *
 * @example
 * ```ts
 * import { isRenderEvent, DomRenderEvent } from "@typed/template/RenderEvent"
 *
 * const event = DomRenderEvent(document.createElement("div"))
 * console.log(isRenderEvent(event)) // true
 * console.log(isRenderEvent("not an event")) // false
 * ```
 *
 * @since 1.0.0
 * @category Renderer output recognition
 */
export function isRenderEvent(event: unknown): event is RenderEvent {
  return hasProperty(event, RenderEventTypeId);
}

/**
 * Checks if a value is a `DomRenderEvent`.
 *
 * @remarks
 * ## Why
 *
 * Consumers can select concrete-node behavior without inspecting node shapes.
 *
 * ## Ownership and lifetime
 *
 * The guard borrows the event and changes no DOM ownership.
 *
 * @example
 * ```ts
 * import { isDomRenderEvent, DomRenderEvent } from "@typed/template/RenderEvent"
 *
 * const event = DomRenderEvent(document.createElement("div"))
 * console.log(isDomRenderEvent(event)) // true
 * ```
 *
 * @since 1.0.0
 * @category Native DOM recognition
 */
export function isDomRenderEvent(event: unknown): event is DomRenderEvent {
  return isRenderEvent(event) && event[RenderEventTypeId] === "dom";
}

/**
 * Checks if a value is an `HtmlRenderEvent`.
 *
 * @remarks
 * ## Why
 *
 * The guard requires both the HTML discriminant and renderer-transport brand,
 * rejecting structurally similar untrusted objects.
 *
 * ## Ownership and lifetime
 *
 * The guard borrows the value and retains no HTML.
 *
 * @example
 * ```ts
 * import { isHtmlRenderEvent, HtmlRenderEvent } from "@typed/template/RenderEvent"
 *
 * const event = HtmlRenderEvent("<div>Hello</div>", true)
 * console.log(isHtmlRenderEvent(event)) // true
 * ```
 *
 * @since 1.0.0
 * @category HTML transport recognition
 */
export function isHtmlRenderEvent(event: unknown): event is HtmlRenderEvent {
  return (
    isRenderEvent(event) &&
    event[RenderEventTypeId] === "html" &&
    hasProperty(event, HtmlRenderTransportBrand) &&
    event[HtmlRenderTransportBrand] === true
  );
}
