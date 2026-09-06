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

/** An inert definition shared by browser registration and server rendering.
 * defaults runs once per element or server render. Inputs are parent-owned;
 * local writable state can be created in an Effect returned by render.
 * @since 1.0.0
 * @category Web Components
 */
export interface Definition<Props extends object, View extends Renderable.Any> {
  readonly name: string;
  readonly defaults: () => Props;
  readonly stopPropagation?: RootEventOptions;
  /** A synchronous Schema whose finite encoded keys become observedAttributes. */
  readonly attributes?: Schema.Codec<
    Partial<Props>,
    Readonly<Record<string, string | null | undefined>>
  >;
  readonly render: (props: RefSubject.Computed<Props>) => View;
}

/** A registered element accepts typed input through its props property.
 * Assign a new object to update; nested mutation is not observed.
 * @since 1.0.0
 * @category Web Components
 */
export interface Element<Props extends object> extends HTMLElement {
  props: Props;
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
export function make<Props extends object, const View extends Renderable.Any>(
  definition: Definition<Props, View>,
): Definition<Props, View> {
  if (
    !/^[a-z][a-z0-9._]*-[a-z0-9._-]*$/.test(definition.name) ||
    reservedNames.has(definition.name)
  ) {
    throw new TypeError(`Invalid custom element name: ${definition.name}`);
  }

  const names = new Set<string>();
  for (const name of attributeNames(definition)) {
    if (!/^[a-z_][a-z0-9_.:-]*$/.test(name) || /^on/i.test(name) || names.has(name)) {
      throw new TypeError(`Invalid or duplicate custom element attribute: ${name}`);
    }
    names.add(name);
  }

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
export function register<Props extends object, View extends Renderable.Any>(
  definition: Definition<Props, View>,
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

      const attributes = definition.attributes;
      let active = true;

      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          active = false;
        }),
      );

      return yield* Effect.try({
        try: () => {
          make(definition);

          const observedAttributes = attributeNames(definition);
          const decode = attributes === undefined ? undefined : Schema.decodeExit(attributes);

          const window = document.defaultView;
          if (window === null)
            throw new TypeError("Custom elements require a document with a window");

          const registry = window.customElements;
          const CustomEvent = window.CustomEvent;
          const Base = (window as Window & typeof globalThis).HTMLElement;

          class TypedElement extends Base implements Element<Props> {
            static readonly observedAttributes = observedAttributes;

            private _props = definition.defaults();
            private initialProps = this._props;
            private upgradeProps: Props | undefined;
            private input: RefSubject.RefSubject<Props> | undefined;
            private root: HTMLElement | ShadowRoot | undefined;
            private connections: Subject.Subject<boolean> | undefined;
            private readonly connected = Fx.genScoped(
              function* (this: TypedElement) {
                const root = this.root ?? (this.root = getRoot(this, shadow));
                yield* rootEvents(root, definition.stopPropagation);

                const input = yield* RefSubject.make(this.initialProps);
                yield* input;

                yield* Effect.addFinalizer(() =>
                  Effect.sync(() => {
                    if (this.input === input) this.input = undefined;
                  }),
                );

                return render(definition.render(input), root as HTMLElement).pipe(
                  Fx.tap(() => {
                    this.input = input;
                    return RefSubject.set(input, this._props);
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
                this._props = value;
                this.upgradeProps = value;
              }
            }

            get props(): Props {
              return this._props;
            }

            set props(value: Props) {
              this.upgradeProps = undefined;
              this._props = value;

              const input = this.input;
              if (input !== undefined && active && this.isConnected) {
                run(RefSubject.set(input, value));
              }
            }

            attributeChangedCallback(_name: string, oldValue: string | null, value: string | null) {
              if (oldValue === value) return;

              if (decode === undefined) return;

              const encoded = Object.fromEntries(
                observedAttributes.flatMap((attribute): [string, string][] => {
                  const value = this.getAttribute(attribute);
                  return value === null ? [] : [[attribute, value]];
                }),
              );
              const decoded = decode(encoded);

              if (Exit.isFailure(decoded)) {
                if (active && this.isConnected) {
                  this.dispatchEvent(
                    new CustomEvent("typed:error", {
                      detail: decoded.cause,
                      bubbles: true,
                      composed: true,
                    }),
                  );
                }
                return;
              }

              const upgradeProps = this.upgradeProps;
              this.props = { ...this._props, ...decoded.value };
              this.upgradeProps = upgradeProps;
            }

            connectedCallback() {
              if (!active) return;

              if (this.upgradeProps !== undefined) this.props = this.upgradeProps;
              this.initialProps = this._props;
              if (this.style.display === "") this.style.display = "contents";
              if (this.connections === undefined) {
                const connections = Subject.unsafeMake<boolean>(1);
                this.connections = connections;

                run(
                  Fx.if(connections, {
                    onTrue: this.connected,
                    onFalse: Fx.empty,
                  }).pipe(
                    Fx.ensuring(
                      Effect.sync(() => {
                        if (this.connections === connections) this.connections = undefined;
                      }),
                    ),
                    Fx.drain,
                    Effect.scoped,
                  ),
                );
              }

              run(this.connections.onSuccess(true));
            }

            disconnectedCallback() {
              this.input = undefined;
              const connections = this.connections;
              if (connections === undefined) return;

              run(
                connections.onSuccess(false).pipe(
                  Effect.andThen(() => {
                    if (this.isConnected || this.connections !== connections) return Effect.void;

                    this.connections = undefined;
                    return connections.interrupt;
                  }),
                ),
              );
            }
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
  Props extends object,
  View extends Renderable.Any,
  Children extends Renderable.Any = undefined,
>(
  definition: Definition<Props, View>,
  initial: Partial<Props> = {},
  children?: Children,
): Fx.Fx<
  HtmlRenderEvent,
  Renderable.Error<View> | Renderable.Error<Children>,
  Renderable.Services<View> | Renderable.Services<Children> | Scope.Scope
> {
  return Fx.gen(function* () {
    make(definition);

    const shadow = yield* CurrentShadowRoot;

    if (shadow === false && children !== undefined) {
      return yield* Effect.die(new TypeError("Light DOM components own their host children"));
    }

    const props = { ...definition.defaults(), ...initial };
    const input = yield* RefSubject.make(props);

    let hasStyle = false;
    let attributes = "";

    if (definition.attributes !== undefined) {
      const encoded = Schema.encodeSync(definition.attributes)(props);
      for (const [name, value] of Object.entries(encoded)) {
        if (value === null || value === undefined) continue;

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

    const view = renderToHtml(definition.render(input));
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

function attributeNames<Props extends object, View extends Renderable.Any>(
  definition: Definition<Props, View>,
): ReadonlyArray<string> {
  const attributes = definition.attributes;
  if (attributes === undefined) return [];

  const encoded = Schema.toEncoded(attributes).ast;
  if (encoded._tag !== "Objects" || encoded.indexSignatures.length > 0) {
    throw new TypeError("Web Component attributes require a finite set of encoded keys");
  }

  return encoded.propertySignatures.map((property) => {
    if (typeof property.name !== "string") {
      throw new TypeError("Web Component attribute names must be strings");
    }
    return property.name;
  });
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
