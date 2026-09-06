import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import type { RefSubject } from "@typed/fx";
import type { Fx } from "@typed/fx/Fx";
import type { EventHandler, Renderable, RenderEvent, RenderTemplate } from "@typed/template";

/**
 * Any value accepted by Typed's renderable conversion protocol.
 *
 * @remarks
 * ## Why
 * Host components accept static values, Effects, Fx streams, templates, and
 * other renderables through one type without imposing a virtual DOM.
 *
 * ## Ownership and lifetime
 * The eventual renderer Scope owns reactive inputs and their cleanup; this
 * alias itself acquires nothing.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type RenderableInput<A = any> = Renderable.Any<A>;

/**
 * An Effect accepted at a DOM host boundary while preserving error and service inference.
 *
 * @remarks
 * ## Why
 * The union prevents `never` channels from being widened when heterogeneous
 * host inputs are inferred.
 *
 * ## Ownership and lifetime
 * The Effect stays lazy and is owned by the Scope that renders the host.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type EffectInput<A = any> =
  | Effect.Effect<A, any, any>
  | Effect.Effect<A, never, never>
  | Effect.Effect<never, any, any>
  | Effect.Effect<never, never, any>;
/**
 * An Fx accepted at a DOM host boundary while preserving error and service inference.
 *
 * @remarks
 * ## Why
 * The explicit union retains precise `never` channels during conditional and
 * mapped-type inference used by custom hosts.
 *
 * ## Ownership and lifetime
 * Supplying an Fx starts no work. Its rendering Scope owns subscription and interruption.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type FxInput<A = any> =
  | Fx<A, any, any>
  | Fx<A, never, never>
  | Fx<never, any, any>
  | Fx<never, never, any>;
/**
 * Output that a host override may return.
 *
 * @remarks
 * ## Why
 * Both one-shot Effects and push-based Fx streams can represent render output,
 * so external hosts need not adopt a framework-specific mounting protocol.
 *
 * ## Ownership and lifetime
 * `renderHost` lifts an Effect into Fx; the component Scope owns either form.
 *
 * @since 1.0.0
 * @category Host rendering types
 */
export type HostResult = FxInput<RenderEvent> | EffectInput<RenderEvent>;

/**
 * A property name recognized as a native DOM event handler.
 *
 * @remarks
 * ## Why
 * Typed supports element properties such as `onclick` and template event keys
 * such as `@click` without synthetic events.
 *
 * ## Ownership and lifetime
 * The key owns nothing; the rendered template installs and removes the real DOM listener.
 *
 * @since 1.0.0
 * @category Event input types
 */
export type EventHandlerProperty = `on${string}` | `@${string}`;

/**
 * Extracts the native Event parameter from an event-handler input.
 *
 * @remarks
 * ## Why
 * Host prop merging must preserve the concrete browser event type while
 * combining user and internal handlers.
 *
 * ## Ownership and lifetime
 * Type-only; listener lifetime remains owned by the rendered template Scope.
 *
 * @since 1.0.0
 * @category Event input types
 */
export type EventOf<Handler> =
  NonNullable<Handler> extends (...args: infer Args) => any
    ? Args[0] extends globalThis.Event
      ? Args[0]
      : globalThis.Event
    : globalThis.Event;

/**
 * Native `on*` handlers supported by a concrete DOM element.
 *
 * @remarks
 * ## Why
 * The browser's own element interface supplies event names and event types,
 * keeping custom hosts aligned with web standards.
 *
 * ## Ownership and lifetime
 * Handlers run as Effects and are detached with the rendering Scope.
 *
 * @since 1.0.0
 * @category Event input types
 */
export type ElementEventHandlers<Element extends globalThis.Element> = {
  readonly [K in keyof Element as K extends `on${string}` ? K : never]?:
    | EffectInput
    | EventHandler.EventHandler<EventOf<Element[K]>, any, any>
    | null;
};

/**
 * Template `@event` handlers for real DOM events.
 *
 * @remarks
 * ## Why
 * Custom or future event names remain expressible without waiting for a DOM
 * interface update and without introducing a synthetic event layer.
 *
 * ## Ownership and lifetime
 * The template Scope owns listener installation, abortion, and removal.
 *
 * @since 1.0.0
 * @category Event input types
 */
export type TemplateEventHandlers = {
  readonly [K in `@${string}`]?: EffectInput | EventHandler.EventHandler<Event, any, any> | null;
};

/**
 * Callback invoked with the exact mounted DOM element.
 *
 * @remarks
 * ## Why
 * A ref can initialize imperative web-standard APIs or return Effect, Stream,
 * or Fx work without replacing the node or hiding its identity.
 *
 * ## Ownership and lifetime
 * Returned Effect, Stream, or Fx work runs in the element's rendering Scope and
 * is interrupted when that Scope closes.
 *
 * @since 1.0.0
 * @category Element ref types
 */
export type ElementRefCallback<Element extends globalThis.Element> = (
  element: Element,
) =>
  | void
  | EffectInput
  | Stream.Stream<any, any, any>
  | Stream.Stream<any, never, never>
  | Fx<any, any, any>
  | Fx<any, never, never>;

/**
 * Optional ref contract shared by DOM-backed component options.
 *
 * @remarks
 * ## Why
 * It supports both ordinary element callbacks and a `RefSubject` hydration
 * owner at the same host boundary.
 *
 * ## Ownership and lifetime
 * A mounted element may have only one hydration owner. Composed ordinary refs
 * share the rendering Scope and must not outlive the element.
 *
 * @since 1.0.0
 * @category Element ref types
 */
export type ElementRef<Element extends globalThis.Element> = {
  /** The callback or sole hydration owner for the mounted element. */
  readonly ref?: ElementRefCallback<Element> | RefSubject.HydrationRef<any, any>;
};

/**
 * Produces `Output` only when two types are mutually assignable.
 *
 * @remarks
 * ## Why
 * DOM host types use exact equality to identify writable properties safely.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Property type utilities
 */
export type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

/**
 * Selects writable keys from a structural type.
 *
 * @remarks
 * ## Why
 * Host props must not promise assignment to browser-owned readonly DOM fields.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Property type utilities
 */
export type WritableKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }, K>;
}[keyof T];

/**
 * Reactive writable properties for a DOM element, excluding events and refs.
 *
 * @remarks
 * ## Why
 * Property assignment preserves native element behavior for values that are
 * not accurately represented as string attributes.
 *
 * ## Ownership and lifetime
 * Reactive values are subscribed within the rendered part's Scope; the exact
 * element remains browser-owned DOM rather than a virtual-node copy.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type ElementProperties<Element extends globalThis.Element> = {
  readonly [
    K in WritableKeys<Element> as K extends string
      ? K extends `on${string}` | "ref"
        ? never
        : K
      : never
  ]?: RenderableInput<Element[K] | null | undefined>;
};

/**
 * Complete event, ref, and writable-property options for an element.
 *
 * @remarks
 * ## Why
 * Library authors can describe custom hosts directly in terms of the DOM API.
 *
 * ## Ownership and lifetime
 * Rendering owns subscriptions and listeners; callers retain ownership of
 * unrelated classes, attributes, children, and surrounding nodes.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type ElementOptions<Element extends globalThis.Element> = ElementEventHandlers<Element> &
  TemplateEventHandlers &
  ElementRef<Element> &
  ElementProperties<Element>;

type StringAttributeValue = RenderableInput<string | null | undefined>;
type AttributeValue = RenderableInput<string | number | boolean | null | undefined>;
type BooleanAttributeValue = RenderableInput<boolean | null | undefined>;
type DataAttributeValue = RenderableInput;
type StyleValue = RenderableInput<
  string | CSSStyleDeclaration | Partial<CSSStyleDeclaration> | null | undefined
>;
type PopoverTargetActionValue = RenderableInput<"toggle" | "show" | "hide" | null | undefined>;
type CommandValue = RenderableInput<
  | "show-modal"
  | "close"
  | "request-close"
  | "show-popover"
  | "hide-popover"
  | "toggle-popover"
  | `--${string}`
  | null
  | undefined
>;

/**
 * Web-standard attributes and Typed template prefixes accepted by every host.
 *
 * @remarks
 * ## Why
 * Attribute, ARIA, data, boolean (`?name`), dataset (`.data`), command, and
 * popover fields stay available to component users instead of being filtered
 * through a framework-owned prop vocabulary.
 *
 * ## Ownership and lifetime
 * Scalar parts retain direct references to their targets and update locally.
 * The renderer removes only values installed through the corresponding part.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type TemplateAttributeProps = {
  readonly id?: StringAttributeValue;
  readonly class?: StringAttributeValue;
  readonly className?: StringAttributeValue;
  readonly for?: StringAttributeValue;
  readonly tabindex?: AttributeValue;
  readonly value?: AttributeValue;
  readonly min?: AttributeValue;
  readonly max?: AttributeValue;
  readonly low?: AttributeValue;
  readonly high?: AttributeValue;
  readonly optimum?: AttributeValue;
  readonly step?: AttributeValue;
  readonly role?: StringAttributeValue;
  readonly style?: StyleValue;
  readonly popover?: StringAttributeValue;
  readonly popovertarget?: StringAttributeValue;
  readonly popovertargetaction?: PopoverTargetActionValue;
  readonly command?: CommandValue;
  readonly commandfor?: StringAttributeValue;
  readonly ".data"?: Readonly<Record<string, RenderableInput>>;
} & {
  readonly [K in `aria-${string}`]?: AttributeValue;
} & {
  readonly [K in `data-${string}`]?: DataAttributeValue;
} & {
  readonly [K in `?${string}`]?: BooleanAttributeValue;
};

type BoundElementProperty = "checked" | "indeterminate" | "selected" | "selectedIndex" | "value";

/**
 * Dot-prefixed live form-control properties supported by an element.
 *
 * @remarks
 * ## Why
 * Values such as `checked` and `selectedIndex` are live DOM state; binding the
 * property avoids lossy attribute reflection.
 *
 * ## Ownership and lifetime
 * The binding is active only for the rendered part's Scope and does not replace
 * the element or synthesize browser state.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type BoundElementProperties<Element extends globalThis.Element> = {
  readonly [K in Extract<keyof Element, BoundElementProperty> as `.${K}`]?: RenderableInput<
    Element[K] | null | undefined
  >;
};

/**
 * Public props accepted by a DOM host for a concrete element type.
 *
 * @remarks
 * ## Why
 * `HostProps` combines native properties, attributes, events, refs, and bound
 * control state in one exact DOM-first contract.
 *
 * ## Ownership and lifetime
 * The host owns only the parts it renders. Existing nodes, unrelated
 * attributes, and external listeners remain untouched.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type HostProps<Element extends globalThis.Element> = Omit<
  ElementOptions<Element>,
  keyof TemplateAttributeProps
> &
  TemplateAttributeProps &
  BoundElementProperties<Element>;

/**
 * Function signature for rendering an arbitrary DOM host.
 *
 * @remarks
 * ## Why
 * Components can target native templates or external DOM-producing systems
 * through the same `Fx<RenderEvent, E, R>` substrate.
 *
 * ## Ownership and lifetime
 * Returning a value starts no work by itself. The caller's rendering Scope owns
 * the returned Effect or Fx and any nodes represented by its render events.
 *
 * @since 1.0.0
 * @category Host rendering types
 */
export type HostRenderer<
  Element extends globalThis.Element,
  A = RenderEvent,
  E = never,
  R = never,
  Props extends HostProps<Element> = HostProps<Element>,
  Content extends RenderableInput = RenderableInput,
> = (props: Props, content: Content) => Fx<A, E, R> | Effect.Effect<A, E, R>;

/**
 * Component-local replacement for its default host element.
 *
 * @remarks
 * ## Why
 * A component can preserve state, behavior, and accessibility props while a
 * caller chooses the element or external renderer that receives them.
 *
 * ## Ownership and lifetime
 * The override owns output it creates. It must apply the supplied merged props
 * so event ordering, disabled behavior, refs, and accessibility remain intact.
 *
 * @since 1.0.0
 * @category Host rendering types
 */
export type HostOverride<
  Props,
  Content extends RenderableInput,
  Result extends HostResult = HostResult,
> = (props: Props, content: Content) => Result;

/**
 * Shared options for a component with an overridable DOM host.
 *
 * @remarks
 * ## Why
 * Components expose ordinary DOM props and refs instead of hiding their host.
 *
 * ## Ownership and lifetime
 * The component Scope owns rendered props and the ref lifetime; unmentioned DOM
 * remains outside the component's ownership.
 *
 * @since 1.0.0
 * @category Host input types
 */
export interface HostOptions<Element extends globalThis.Element> extends ElementRef<Element> {
  /** User-owned DOM props merged with the component's required internal props. */
  readonly props?: HostProps<Element>;
}

/**
 * Native HTML, SVG, and MathML element type lookup by tag name.
 *
 * @remarks
 * ## Why
 * Custom hosts infer from the platform's own tag maps, with HTML taking
 * precedence for colliding names.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type ElementByTagName = HTMLElementTagNameMap &
  Omit<SVGElementTagNameMap, keyof HTMLElementTagNameMap> &
  Omit<MathMLElementTagNameMap, keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>;

/**
 * Element options indexed by native tag name.
 *
 * @remarks
 * ## Why
 * Generic host utilities can retain exact platform event and property types.
 *
 * ## Ownership and lifetime
 * Type-only; rendered options follow the selected host's Scope.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type OptionsByTagName = {
  readonly [Tag in keyof ElementByTagName]: ElementOptions<ElementByTagName[Tag]>;
};

/**
 * Element options for one native tag.
 *
 * @remarks
 * ## Why
 * Avoids repeating indexed-access machinery in host component signatures.
 *
 * ## Ownership and lifetime
 * Type-only; rendering determines lifetime.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type OptionsForTag<Tag extends keyof ElementByTagName> = OptionsByTagName[Tag];

/**
 * Complete host props indexed by native tag name.
 *
 * @remarks
 * ## Why
 * Generic component factories can expose the exact props of their chosen host.
 *
 * ## Ownership and lifetime
 * Type-only; rendered prop parts are Scope-owned.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type HostPropsByTagName = {
  readonly [Tag in keyof ElementByTagName]: HostProps<ElementByTagName[Tag]>;
};

/**
 * Host props for one native tag.
 *
 * @remarks
 * ## Why
 * Provides a readable public alias for tag-specific host APIs.
 *
 * ## Ownership and lifetime
 * Type-only; rendered prop parts are Scope-owned.
 *
 * @since 1.0.0
 * @category Host input types
 */
export type HostPropsForTag<Tag extends keyof ElementByTagName> = HostPropsByTagName[Tag];

/**
 * Renderer signature specialized to a native tag name.
 *
 * @remarks
 * ## Why
 * External or custom hosts can preserve tag-specific props while returning any
 * Effect/Fx render-event producer.
 *
 * ## Ownership and lifetime
 * The running rendering Scope owns returned work and its output range.
 *
 * @since 1.0.0
 * @category Host rendering types
 */
export type HostRendererForTag<
  Tag extends keyof ElementByTagName,
  A = RenderEvent,
  E = never,
  R = never,
  Props extends HostPropsForTag<Tag> = HostPropsForTag<Tag>,
  Content extends RenderableInput = RenderableInput,
> = (props: Props, content: Content) => Fx<A, E, R> | Effect.Effect<A, E, R>;

/**
 * Host options specialized to one native tag.
 *
 * @remarks
 * ## Why
 * Useful for component factories whose tag is a generic parameter.
 *
 * ## Ownership and lifetime
 * Props become Scope-owned render parts when the host is mounted.
 *
 * @since 1.0.0
 * @category Host input types
 */
export interface HostOptionsForTag<Tag extends keyof ElementByTagName> {
  /** User props for the selected native tag. */
  readonly props?: HostPropsForTag<Tag>;
}

/**
 * Effect or `EventHandler` accepted for one real DOM event.
 *
 * @remarks
 * ## Why
 * Components can accept a simple Effect or preserve listener options through
 * `EventHandler` without wrapping browser events in synthetic objects.
 *
 * ## Ownership and lifetime
 * The template Scope installs/removes the listener; an AbortSignal or `once`
 * option may end the handler sooner.
 *
 * @since 1.0.0
 * @category Event input types
 */
export type EventHandlerInput<Ev extends Event = Event, E = any, R = any> =
  | Effect.Effect<unknown, E, R>
  | EventHandler.EventHandler<Ev, E, R>
  | null
  | undefined;

/**
 * JavaScript's two absent-value types.
 *
 * @remarks
 * ## Why
 * Internal prop helpers consistently treat `null` and `undefined` as absent.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Property type utilities
 */
export type Nullish = null | undefined;

/**
 * Removes nullish values from a type.
 *
 * @remarks
 * ## Why
 * Component-required defaults can be represented precisely after fallback.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Property type utilities
 */
export type NonNullish<Value> = Exclude<Value, Nullish>;

/**
 * Safely selects a property type, yielding `undefined` for non-objects or absent keys.
 *
 * @remarks
 * ## Why
 * Generic component options remain precise without unsafe indexed access.
 *
 * ## Ownership and lifetime
 * Type-only and resource-free.
 *
 * @since 1.0.0
 * @category Property type utilities
 */
export type Property<Value, Key extends PropertyKey> = Value extends object
  ? Key extends keyof Value
    ? Value[Key]
    : undefined
  : undefined;

/**
 * Helpers available while constructing component-owned host props.
 *
 * @remarks
 * ## Why
 * Internal defaults can read generic options while retaining exact non-nullish
 * output types.
 *
 * ## Ownership and lifetime
 * Helpers retain only the options object during synchronous prop construction.
 *
 * @since 1.0.0
 * @category Internal prop defaults
 */
export interface InternalPropsHelpers<Options> {
  /** Reads an option and substitutes `fallback` only for `null` or `undefined`. */
  readonly property: <const Key extends PropertyKey, const Fallback>(
    key: Key,
    fallback: Fallback,
  ) => NonNullish<Property<Options, Key>> | Fallback;
}

/**
 * Standard Fx result of a DOM-backed component.
 *
 * @remarks
 * ## Why
 * The alias derives error/service channels from renderable inputs and makes
 * Scope plus `RenderTemplate` requirements explicit.
 *
 * ## Ownership and lifetime
 * The required Scope owns DOM parts, listeners, refs, subscriptions, and
 * cleanup. The host may modify only its represented DOM range.
 *
 * @since 1.0.0
 * @category Host rendering types
 */
export type HostComponent<Inputs> = Fx<
  RenderEvent,
  Renderable.Error<Inputs>,
  Renderable.Services<Inputs> | Scope.Scope | RenderTemplate
>;
