import { Fx, RefSubject, Subject } from "@typed/fx";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FiberSet from "effect/FiberSet";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { renderToHtml } from "./Html.js";
import { escapeHtml } from "./internal/encoding.js";
import { CurrentRenderDocument, DomRenderTemplate, render } from "./Render.js";
import type { Renderable } from "./Renderable.js";
import { HtmlRenderEvent } from "./RenderEvent.js";
import { RenderTemplate } from "./RenderTemplate.js";
import { rootEvents, type RootEventOptions } from "./RootEvents.js";

/** Shadow settings supported by both attachShadow and declarative shadow DOM.
 * @since 1.0.0
 * @category Web Components
 */
export type ShadowRootOptions = Pick<
  ShadowRootInit,
  "mode" | "delegatesFocus" | "clonable" | "serializable"
>;

/** Selects an open shadow root by default. Provide false for light DOM.
 * The selection is captured when the registration layer or server view runs.
 * @since 1.0.0
 * @category Web Components
 */
export const CurrentShadowRoot = Context.Reference<ShadowRootOptions | false>(
  "@typed/template/WebComponent/CurrentShadowRoot",
  { defaultValue: () => ({ mode: "open" }) },
);

/** Schema fields for attributes and dot-prefixed DOM properties.
 * Attribute schemas encode strings; property schemas accept decoded values.
 * @since 1.0.0
 * @category Web Components
 */
export type Fields = Readonly<Record<string, Schema.ConstraintCodec<unknown, unknown>>>;

type NamedFields<F extends Fields> = {
  readonly [K in keyof F as K extends `.${infer Name}` ? Name : K]: F[K];
};

/** Decoded inputs, with the dot removed from property names.
 * @since 1.0.0
 * @category Web Components
 */
export type Props<F extends Fields> = Schema.Struct.Type<NamedFields<F>>;

/** Each field is a read-only computed value, including optional fields.
 * @since 1.0.0
 * @category Web Components
 */
export type RenderProps<F extends Fields> = {
  readonly [K in keyof Props<F>]-?: RefSubject.Computed<Props<F>[K]>;
};

type OptionalInputKeys<F extends Fields> = {
  [K in keyof F]: K extends `.${string}`
    ? F[K]["~type.optionality"] extends "optional"
      ? K
      : F[K]["~type.constructor.default"] extends "with-default"
        ? K
        : never
    : F[K]["~encoded.optionality"] extends "optional"
      ? K
      : never;
}[keyof F];
type InputFields<F extends Fields> = {
  readonly [K in keyof F as K extends `.${infer Name}` ? Name : K]: F[K]["Type"];
};
type OptionalInputNames<F extends Fields> =
  OptionalInputKeys<F> extends infer K extends PropertyKey
    ? K extends `.${infer Name}`
      ? Name
      : K
    : never;

/** Typed initial values; only schema-optional or defaulted inputs may be omitted.
 * @since 1.0.0
 * @category Web Components
 */
export type Input<F extends Fields> = Omit<InputFields<F>, OptionalInputNames<F>> &
  Partial<Pick<InputFields<F>, Extract<keyof InputFields<F>, OptionalInputNames<F>>>>;

type ValidFields<F extends Fields> = {
  readonly [K in keyof F]: K extends `.${string}`
    ? F[K]
    : F[K] extends Schema.ConstraintCodec<unknown, string | null | undefined>
      ? F[K]
      : never;
};

/** An inert definition shared by browser registration and server rendering.
 * Schemas supply optionality and defaults. Inputs are parent-owned;
 * local writable state can be created in an Effect returned by render.
 * @since 1.0.0
 * @category Web Components
 */
export interface Definition<F extends Fields, View extends Renderable.Any> {
  readonly name: string;
  readonly stopPropagation?: RootEventOptions;
  /** Synchronous schema fields. Use `.name` for a DOM property instead of an attribute. */
  readonly attributes?: F;
  readonly render: (props: RenderProps<F>) => View;
}

/** A registered element accepts typed input through its props property.
 * Assign a new object to update; nested mutation is not observed.
 * @since 1.0.0
 * @category Web Components
 */
export interface Element<Props extends object> extends HTMLElement {
  /** Undefined until the element has a valid complete input snapshot. */
  get props(): Props | undefined;
  set props(value: Props);
}

/** A browser registry could not accept a definition.
 * @since 1.0.0
 * @category Web Components
 */
export class RegistrationError extends Error {
  readonly _tag = "RegistrationError";

  constructor(readonly cause: unknown) {
    super("Could not register Typed custom element", { cause });
  }
}

/** Defines a custom element without reading any browser globals.
 * Custom-element names use a conservative ASCII subset of the HTML grammar.
 * @since 1.0.0
 * @category Web Components
 */
export function make<const F extends Fields = {}, const View extends Renderable.Any = never>(
  definition: Definition<F, View> & { readonly attributes?: F & ValidFields<F> },
): Definition<F, View> {
  validateName(definition.name);
  fieldDefinitions(definition);

  return definition;
}

/** Registers in CurrentRenderDocument's registry and captures the layer's services.
 * Provides no services; use the custom element through ordinary HTML templates.
 * The layer's Scope owns every connected instance. Closing it stops rendering
 * and deactivates this class; browsers cannot unregister a custom element.
 * Disconnect interrupts subscriptions/listeners; reconnect waits for cleanup
 * before starting a fresh view. Failures dispatch typed:error with a Cause
 * in CustomEvent.detail. Native template event handlers work without an adapter.
 * Shadow roots retain slotted light children. Light mode owns all host children.
 * @since 1.0.0
 * @category Web Components
 */
export function register<F extends Fields, View extends Renderable.Any>(
  definition: Definition<F, View>,
): Layer.Layer<
  never,
  RegistrationError,
  Exclude<Exclude<Renderable.Services<View>, RenderTemplate>, Scope.Scope>
> {
  return Layer.effectDiscard(
    Effect.gen(function* () {
      type Services = Renderable.Services<View> | RenderTemplate;

      const document = yield* CurrentRenderDocument;
      const shadow = yield* CurrentShadowRoot;

      const current = yield* Effect.serviceOption(RenderTemplate);
      const renderer = Option.isSome(current)
        ? Context.make(RenderTemplate, current.value)
        : yield* Layer.buildWithScope(DomRenderTemplate.using(document), yield* Scope.Scope);
      const run = yield* FiberSet.makeRuntime<Services>().pipe(Effect.provideContext(renderer));

      type Props = Schema.Struct.Type<NamedFields<F>>;
      let active = true;

      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          active = false;
        }),
      );

      return yield* Effect.try({
        try: () => {
          validateName(definition.name);
          const fields = fieldDefinitions(definition);
          const attributes = Schema.Struct(fields.attributes);
          const properties = Schema.Struct(fields.properties);
          const observedAttributes = Object.keys(fields.attributes);
          const decode = Schema.decodeUnknownExit(attributes);

          const window = document.defaultView;
          if (window === null)
            throw new TypeError("Custom elements require a document with a window");

          const registry = window.customElements;
          const CustomEvent = window.CustomEvent;
          const Base = (window as Window & typeof globalThis).HTMLElement;

          class TypedElement extends Base implements Element<Props> {
            static readonly observedAttributes = observedAttributes;

            #_props: Props | undefined;
            #initialProps: Props | undefined;
            #propertyValues: Record<string, unknown> = {};
            #upgradeProps: Props | undefined;
            #input: RefSubject.RefSubject<Props> | undefined;
            #root: HTMLElement | ShadowRoot | undefined;
            #connections: Subject.Subject<boolean> | undefined;
            readonly #connected = Fx.genScoped(
              function* (this: TypedElement) {
                const root = this.#root ?? (this.#root = getRoot(this, shadow));
                yield* rootEvents(root, definition.stopPropagation);

                const initial = this.#initialProps;
                if (initial === undefined) return Fx.empty;
                const input = yield* RefSubject.make(initial);
                yield* input;

                yield* Effect.addFinalizer(() =>
                  Effect.sync(() => {
                    if (this.#input === input) this.#input = undefined;
                  }),
                );

                return render(
                  definition.render(RefSubject.proxy(input) as RenderProps<F>),
                  root as HTMLElement,
                ).pipe(
                  Fx.tap(() => {
                    this.#input = input;
                    return this.#_props === undefined
                      ? Effect.void
                      : RefSubject.set(input, this.#_props);
                  }),
                  Fx.continueWith(() => Fx.never),
                );
              }.bind(this),
            ).pipe(
              Fx.catchCause((cause) =>
                Fx.fromEffect(
                  Effect.sync(() => {
                    if (!Cause.hasInterruptsOnly(cause) && active && this.isConnected) {
                      this.dispatchEvent(
                        new CustomEvent("typed:error", {
                          detail: cause,
                          bubbles: true,
                          composed: true,
                        }),
                      );
                    }
                  }),
                ),
              ),
            );

            constructor() {
              super();

              // An own property set before customElements.define shadows the accessor.
              if (Object.hasOwn(this, "props")) {
                const value = this.props;
                Reflect.deleteProperty(this, "props");
                this.#_props = value;
                this.#upgradeProps = value;
              }
              for (const name of Object.keys(fields.properties)) {
                if (Object.hasOwn(this, name)) {
                  this.#propertyValues[name] = Reflect.get(this, name);
                  Reflect.deleteProperty(this, name);
                }
              }
            }

            get props(): Props | undefined {
              return this.#_props;
            }

            set props(value: Props) {
              this.#updateProps(value);
              if (active && this.isConnected && this.#connections === undefined)
                this.connectedCallback();
            }

            #updateProps(value: Props) {
              this.#upgradeProps = undefined;
              this.#_props = value;
              this.#propertyValues = Object.fromEntries(
                Object.keys(fields.properties).flatMap((name) =>
                  Object.hasOwn(value, name) ? [[name, Reflect.get(value, name)]] : [],
                ),
              );

              const input = this.#input;
              if (input !== undefined && active && this.isConnected) {
                run(RefSubject.set(input, value));
              }
            }

            attributeChangedCallback(_name: string, oldValue: string | null, value: string | null) {
              if (oldValue === value) return;

              if (this.#readAttributes() && this.isConnected && this.#connections === undefined)
                this.connectedCallback();
            }

            #readAttributes(): boolean {
              const encoded = Object.fromEntries(
                observedAttributes.flatMap((attribute): [string, string][] => {
                  const value = this.getAttribute(attribute);
                  return value === null ? [] : [[attribute, value]];
                }),
              );
              const decoded = decode(encoded);

              if (Exit.isFailure(decoded)) {
                this.#report(decoded.cause);
                return false;
              }

              const propertyValues = Effect.runSyncExit(
                properties.makeEffect(this.#propertyValues),
              );
              if (Exit.isFailure(propertyValues)) {
                this.#report(propertyValues.cause);
                return false;
              }
              const upgradeProps = this.#upgradeProps;
              this.#updateProps({ ...decoded.value, ...propertyValues.value } as Props);
              this.#upgradeProps = upgradeProps;
              return true;
            }

            #report(cause: Cause.Cause<unknown>) {
              if (active && this.isConnected) {
                this.dispatchEvent(
                  new CustomEvent("typed:error", {
                    detail: cause,
                    bubbles: true,
                    composed: true,
                  }),
                );
              }
            }

            setProperty(name: string, value: unknown) {
              const next = { ...this.#propertyValues, [name]: value };
              const decoded = Schema.decodeUnknownExit(Schema.toType(fields.properties[name]))(
                value,
              );
              if (Exit.isFailure(decoded)) {
                this.#report(decoded.cause);
                return;
              }
              this.#propertyValues = next;
              if (this.#_props !== undefined)
                this.props = { ...this.#_props, [name]: decoded.value };
              else if (this.#readAttributes() && this.isConnected) this.connectedCallback();
            }

            getProperty(name: string) {
              return this.#propertyValues[name];
            }

            connectedCallback() {
              if (!active) return;

              if (this.#upgradeProps !== undefined) this.#updateProps(this.#upgradeProps);
              if (this.#_props === undefined && !this.#readAttributes()) return;
              this.#initialProps = this.#_props;
              if (this.style.display === "") this.style.display = "contents";
              if (this.#connections === undefined) {
                const connections = Subject.unsafeMake<boolean>(1);
                this.#connections = connections;

                run(
                  Fx.if(connections, {
                    onTrue: this.#connected,
                    onFalse: Fx.empty,
                  }).pipe(
                    Fx.ensuring(
                      Effect.sync(() => {
                        if (this.#connections === connections) this.#connections = undefined;
                      }),
                    ),
                    Fx.drain,
                    Effect.scoped,
                  ),
                );
              }

              run(this.#connections.onSuccess(true));
            }

            disconnectedCallback() {
              this.#input = undefined;
              const connections = this.#connections;
              if (connections === undefined) return;

              run(
                connections.onSuccess(false).pipe(
                  Effect.andThen(() => {
                    if (this.isConnected || this.#connections !== connections) return Effect.void;

                    this.#connections = undefined;
                    return connections.interrupt;
                  }),
                ),
              );
            }
          }

          for (const name of Object.keys(fields.properties)) {
            if (name in TypedElement.prototype) {
              throw new TypeError(
                `Custom element property conflicts with the element API: ${name}`,
              );
            }
            Object.defineProperty(TypedElement.prototype, name, {
              configurable: true,
              get(this: TypedElement) {
                return this.getProperty(name);
              },
              set(this: TypedElement, value: unknown) {
                this.setProperty(name, value);
              },
            });
          }
          registry.define(definition.name, TypedElement);
        },
        catch: (cause) => new RegistrationError(cause),
      });
    }),
  );
}

/** Produces a server Renderable with a custom-element host and hydratable content.
 * Shadow mode emits declarative shadow DOM followed by optional slot content.
 * Light mode owns all host children and rejects supplied slot content.
 * Only properties declared in the attribute schema are serialized; match CurrentShadowRoot on the client.
 * Body and slot chunks retain their order, errors, services, and calling Scope.
 * Use Typed's renderToHtml to stream or renderToHtmlString to collect the result.
 * @since 1.0.0
 * @category Web Components
 */
export function server<
  F extends Fields,
  View extends Renderable.Any,
  Children extends Renderable.Any = undefined,
>(
  definition: Definition<F, View>,
  ...args: {} extends Input<F>
    ? [initial?: Input<F>, children?: Children]
    : [initial: Input<F>, children?: Children]
): Fx.Fx<
  HtmlRenderEvent,
  Renderable.Error<View> | Renderable.Error<Children>,
  Renderable.Services<View> | Renderable.Services<Children> | Scope.Scope
> {
  return Fx.gen(function* () {
    validateName(definition.name);
    const fields = fieldDefinitions(definition);
    const [initial = {}, children] = args;

    const shadow = yield* CurrentShadowRoot;

    if (shadow === false && children !== undefined) {
      return yield* Effect.die(new TypeError("Light DOM components own their host children"));
    }

    const missing = Object.fromEntries(
      Object.entries(fields.attributes).filter(([name]) => !Object.hasOwn(initial, name)),
    );
    const defaults = Schema.decodeSync(Schema.Struct(missing))({});
    const propertyInput = Object.fromEntries(
      Object.keys(fields.properties).flatMap((name) =>
        Object.hasOwn(initial, name) ? [[name, Reflect.get(initial, name)]] : [],
      ),
    );
    const props = {
      ...defaults,
      ...initial,
      ...Schema.Struct(fields.properties).make(propertyInput),
    } as Props<F>;
    const input = yield* RefSubject.make(props);

    let hasStyle = false;
    let attributes = "";

    {
      const attributeProps = Object.fromEntries(
        Object.keys(fields.attributes).flatMap((name) =>
          Object.hasOwn(props, name) ? [[name, Reflect.get(props, name)]] : [],
        ),
      );
      const encoded = Schema.encodeUnknownSync(Schema.Struct(fields.attributes))(attributeProps);
      for (const [name, value] of Object.entries(encoded)) {
        if (value === null || value === undefined) continue;
        if (typeof value !== "string")
          throw new TypeError(`Attribute ${name} must encode a string`);

        hasStyle ||= name === "style";
        attributes += ` ${name}="${escapeHtml(value)}"`;
      }
    }

    if (!hasStyle) attributes = ` style="display:contents"${attributes}`;

    let opening = `<${definition.name}${attributes}>`;

    if (shadow !== false) {
      const shadowAttributes = [
        `shadowrootmode="${shadow.mode}"`,
        shadow.delegatesFocus && "shadowrootdelegatesfocus",
        shadow.clonable && "shadowrootclonable",
        shadow.serializable && "shadowrootserializable",
      ]
        .filter(Boolean)
        .join(" ");

      opening += `<template ${shadowAttributes}>`;
    }

    const view = renderToHtml(definition.render(RefSubject.proxy(input) as RenderProps<F>));
    const content =
      shadow === false
        ? view
        : view.pipe(
            Fx.concat(Fx.succeed("</template>")),
            Fx.concat(renderToHtml<Children | undefined>(children)),
          );

    return Fx.succeed(HtmlRenderEvent(opening, false)).pipe(
      Fx.concat(Fx.map(content, (chunk) => HtmlRenderEvent(chunk, false))),
      Fx.concat(Fx.succeed(HtmlRenderEvent(`</${definition.name}>`, true))),
    );
  });
}

function getRoot(host: HTMLElement, shadow: ShadowRootOptions | false): HTMLElement | ShadowRoot {
  const existing = host.shadowRoot ?? host.attachInternals().shadowRoot;
  const template = host.querySelector<HTMLTemplateElement>(":scope > template[shadowrootmode]");

  if (shadow === false) {
    if (existing !== null || template !== null)
      throw new TypeError("Expected light DOM but found a shadow root");
    return host;
  }

  // attachInternals exposes closed declarative roots without clearing their content.
  if (existing !== null) {
    if (existing.mode !== shadow.mode) throw new TypeError("Server and client shadow modes differ");
    return existing;
  }

  if (template !== null && template.getAttribute("shadowrootmode") !== shadow.mode) {
    throw new TypeError("Server and client shadow modes differ");
  }

  const root = host.attachShadow(shadow);

  // innerHTML does not activate DSD. Adopt the inert template's original nodes.
  if (template !== null) {
    root.append(template.content);
    template.remove();
  }

  return root;
}

function validateName(name: string) {
  if (!/^[a-z][a-z0-9._]*-[a-z0-9._-]*$/.test(name) || reservedNames.has(name)) {
    throw new TypeError(`Invalid custom element name: ${name}`);
  }
}

function fieldDefinitions<F extends Fields, View extends Renderable.Any>(
  definition: Definition<F, View>,
) {
  const attributes: Record<string, Schema.ConstraintCodec<unknown, unknown>> = Object.create(null);
  const properties: Record<string, Schema.ConstraintCodec<unknown, unknown>> = Object.create(null);
  const names = new Set<string>();
  for (const key of Reflect.ownKeys(definition.attributes ?? {})) {
    if (typeof key !== "string") throw new TypeError("Web Component field names must be strings");
    const property = key.startsWith(".");
    const name = property ? key.slice(1) : key;
    if (
      !(property ? /^[a-zA-Z_$][a-zA-Z0-9_$]*$/ : /^[a-z_][a-z0-9_.:-]*$/).test(name) ||
      /^on/i.test(name) ||
      names.has(name) ||
      name === "props" ||
      name in Object.prototype
    ) {
      throw new TypeError(`Invalid or duplicate custom element field: ${key}`);
    }
    names.add(name);
    (property ? properties : attributes)[name] = definition.attributes![key];
  }
  return { attributes, properties };
}

const reservedNames = new Set([
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
]);
