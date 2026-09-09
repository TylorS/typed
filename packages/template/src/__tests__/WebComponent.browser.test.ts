import { Fx, RefSubject } from "@typed/fx";
import {
  Cause,
  Context,
  Deferred,
  Effect,
  Exit,
  Layer,
  ManagedRuntime,
  Schema,
  Scope,
} from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { html, RenderTemplate } from "../RenderTemplate.js";
import { HtmlRenderTemplate, renderToHtmlString } from "../Html.js";
import { CurrentRenderPriority, DomRenderTemplate, render } from "../Render.js";
import { RenderPriority } from "../RenderQueue.js";
import * as WebComponent from "../WebComponent.js";
import { CurrentRootEvents } from "../RootEvents.js";

let nextId = 0;
const name = () => `typed-test-${Date.now()}-${nextId++}`;
const scopes: Array<Scope.Closeable> = [];
const openScope = async () => {
  const scope = await Effect.runPromise(Scope.make());
  scopes.push(scope);
  return scope;
};
const numberAttribute = Schema.FiniteFromString.pipe(
  Schema.withDecodingDefaultKey(Effect.succeed("0")),
);
const register = <F extends WebComponent.Fields, V>(
  definition: WebComponent.Definition<F, V>,
  scope: Scope.Closeable,
  shadow: WebComponent.ShadowRootOptions | false = { mode: "open" },
) =>
  WebComponent.register(definition).pipe(
    Layer.buildWithScope(scope),
    Effect.asVoid,
    Effect.provideService(WebComponent.CurrentShadowRoot, shadow),
    Effect.provideService(CurrentRenderPriority, RenderPriority.Sync),
    // Fixtures have no additional application services.
  );

const createElement = <F extends WebComponent.Fields, V>(
  definition: WebComponent.Definition<F, V>,
) => document.createElement(definition.name) as WebComponent.Element<WebComponent.Props<F>>;

afterEach(async () => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  await Promise.all(
    scopes.splice(0).map((scope) => Effect.runPromise(Scope.close(scope, Exit.void))),
  );
});

describe("Typed custom elements", () => {
  it("uses schema defaults, computed fields, and clears removed optional attributes", async () => {
    const definition = WebComponent.make({
      name: name(),
      attributes: { count: numberAttribute, label: Schema.optionalKey(Schema.String) },
      render: ({ count, label }) => html`<p>${count}:${label}</p>`,
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("0:"));
    const paragraph = element.shadowRoot!.querySelector("p");
    element.setAttribute("label", "hello");
    element.setAttribute("count", "3");
    await vi.waitFor(() => expect(paragraph?.textContent).toBe("3:hello"));
    element.removeAttribute("label");
    await vi.waitFor(() => expect(paragraph?.textContent).toBe("3:"));
    expect(element.props).toEqual({ count: 3 });
    expect(element.shadowRoot!.querySelector("p")).toBe(paragraph);
  });

  it("accepts dot properties through ordinary templates and preserves them across attribute updates", async () => {
    const definition = WebComponent.make({
      name: "typed-property-input",
      attributes: {
        count: numberAttribute,
        ".input": Schema.Struct({ name: Schema.String }),
      },
      render: ({ count, input }) =>
        html`<p>${count}:${RefSubject.map(input, (value) => value.name)}</p>`,
    });
    const scope = await openScope();
    await Effect.runPromise(register(definition, scope));
    const user = await Effect.runPromise(
      RefSubject.make({ name: "Ada" }).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    const runtime = ManagedRuntime.make(DomRenderTemplate);
    try {
      runtime.runFork(
        render(html`<typed-property-input .input=${user} />`, document.body).pipe(
          Fx.drain,
          Effect.scoped,
        ),
      );
      await vi.waitFor(() =>
        expect(document.querySelector("typed-property-input")?.shadowRoot?.textContent).toBe(
          "0:Ada",
        ),
      );
      const element = document.querySelector("typed-property-input")!;
      element.setAttribute("count", "2");
      await Effect.runPromise(RefSubject.set(user, { name: "Grace" }));
      await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("2:Grace"));
      expect(element.hasAttribute("input")).toBe(false);
    } finally {
      await runtime.dispose();
    }
  });

  it("waits for required attributes, reports missing inputs, and recovers when they arrive", async () => {
    let renders = 0;
    const definition = WebComponent.make({
      name: name(),
      attributes: { count: Schema.FiniteFromString },
      render: ({ count }) => {
        renders++;
        return html`<p>${count}</p>`;
      },
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    const errors: unknown[] = [];
    element.addEventListener("typed:error", (event) => errors.push((event as CustomEvent).detail));
    document.body.append(element);
    expect(element.props).toBeUndefined();
    expect(renders).toBe(0);
    expect(errors).toHaveLength(1);
    element.setAttribute("count", "4");
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("4"));
    expect(renders).toBe(1);
    element.removeAttribute("count");
    expect(errors).toHaveLength(2);
    expect(element.props).toEqual({ count: 4 });
  });

  it("restores dot properties assigned before upgrade and applies constructor defaults per instance", async () => {
    let defaults = 0;
    const definition = WebComponent.make({
      name: name(),
      attributes: {
        count: numberAttribute,
        ".user": Schema.Struct({ name: Schema.String }),
        ".instanceId": Schema.Finite.pipe(
          Schema.withConstructorDefault(Effect.sync(() => ++defaults)),
        ),
      },
      render: ({ user, instanceId }) =>
        html`<p>${RefSubject.map(user, (value) => value.name)}:${instanceId}</p>`,
    });
    const first = document.createElement(definition.name);
    const second = document.createElement(definition.name);
    Reflect.set(first, "user", { name: "Ada" });
    Reflect.set(second, "user", { name: "Grace" });
    document.body.append(first, second);
    await Effect.runPromise(register(definition, await openScope()));
    await vi.waitFor(() => expect(first.shadowRoot?.textContent).toBe("Ada:1"));
    await vi.waitFor(() => expect(second.shadowRoot?.textContent).toBe("Grace:2"));
    first.setAttribute("count", "9");
    first.remove();
    document.body.append(first);
    await vi.waitFor(() => expect(first.shadowRoot?.textContent).toBe("Ada:1"));
    expect(defaults).toBe(2);
    expect(Reflect.get(first, "user")).toEqual({ name: "Ada" });
  });

  it("composes registration as a layer and renders custom elements through html", async () => {
    const Labels = Context.Service<{ readonly count: string }>("WebComponentLayerLabels");
    let connected = 0;
    let released = 0;

    const definition = WebComponent.make({
      name: "typed-layer-counter",

      attributes: { count: numberAttribute },
      render: (props) =>
        Effect.gen(function* () {
          const labels = yield* Labels;
          connected++;

          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              released++;
            }),
          );

          return html`<p>${labels.count}: ${props.count}</p>`;
        }),
    });

    const CounterLive = WebComponent.register(definition).pipe(
      Layer.provide(Layer.succeed(Labels, { count: "Count" })),
    );
    const runtime = ManagedRuntime.make(
      Layer.mergeAll(DomRenderTemplate, CounterLive, CounterLive),
    );

    try {
      const program = render(html`<typed-layer-counter count=${2} />`, document.body);
      runtime.runFork(program.pipe(Fx.drain, Effect.andThen(Effect.never), Effect.scoped));

      await vi.waitFor(() => {
        const element = document.querySelector("typed-layer-counter") as WebComponent.Element<{
          count: number;
        }> | null;
        expect(element?.props).toEqual({ count: 2 });
        expect(document.querySelector("typed-layer-counter")?.shadowRoot?.textContent).toBe(
          "Count: 2",
        );
      });
      expect(connected).toBe(1);
    } finally {
      await runtime.dispose();
    }

    expect(released).toBe(1);
  });

  it("renders props and observed attributes without replacing retained nodes", async () => {
    const definition = WebComponent.make({
      name: name(),

      attributes: { count: numberAttribute },
      render: (props) => html`<p>${props.count}</p>`,
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("0"));
    const paragraph = element.shadowRoot!.querySelector("p");
    element.props = { count: 2 };
    await vi.waitFor(() => expect(paragraph?.textContent).toBe("2"));
    element.setAttribute("count", "3");
    await vi.waitFor(() => expect(paragraph?.textContent).toBe("3"));
    element.removeAttribute("count");
    await vi.waitFor(() => expect(paragraph?.textContent).toBe("0"));
    expect(element.shadowRoot!.querySelector("p")).toBe(paragraph);
  });

  it("preserves props and reports the schema cause for an invalid attribute", async () => {
    const definition = WebComponent.make({
      name: name(),

      attributes: { count: numberAttribute },
      render: (props) => html`<p>${props.count}</p>`,
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    const errors: unknown[] = [];
    element.addEventListener("typed:error", (event) => errors.push((event as CustomEvent).detail));
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("0"));

    element.setAttribute("count", "not-a-number");

    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(element.props).toEqual({ count: 0 });
    const cause = errors[0];
    if (!Cause.isCause(cause)) throw new Error("Expected an Effect cause");

    expect(Schema.isSchemaError(Cause.squash(cause))).toBe(true);
    expect(String(Cause.squash(cause))).toContain("Expected a finite number");

    element.setAttribute("count", "4");
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("4"));
  });

  it("uses literal attribute names as computed field keys", async () => {
    const definition = WebComponent.make({
      name: name(),

      attributes: { "data-count": numberAttribute },
      render: (props) => html`<p>${props["data-count"]}</p>`,
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    element.setAttribute("data-count", "3");
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("3"));
    expect(element.props).toEqual({ "data-count": 3 });
  });

  it("retains a props property assigned before upgrade", async () => {
    const definition = WebComponent.make({
      name: name(),

      attributes: { count: numberAttribute },
      render: (props) => html`<p>${props.count}</p>`,
    });
    const element = document.createElement(definition.name) as WebComponent.Element<{
      count: number;
    }>;
    element.setAttribute("count", "5");
    element.props = { count: 12 };
    document.body.append(element);
    await Effect.runPromise(register(definition, await openScope()));
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("12"));
    element.props = { count: 13 };
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("13"));
  });

  for (const shadow of [false, { mode: "open" }, { mode: "closed" }] as const) {
    it(`hydrates server nodes and input state for ${shadow === false ? "light" : shadow.mode} DOM`, async () => {
      const definition = WebComponent.make({
        name: name(),

        attributes: { value: Schema.String },
        render: (props) => html`<label>${props.value}<input /></label><slot></slot>`,
      });
      const markup = await Effect.runPromise(
        renderToHtmlString(WebComponent.server(definition, { value: "SSR" })).pipe(
          Effect.provide(HtmlRenderTemplate),
          Effect.scoped,
          Effect.provideService(WebComponent.CurrentShadowRoot, shadow),
        ),
      );
      const container = document.createElement("div");
      // setHTMLUnsafe runs the platform's declarative shadow parser, including closed roots.
      container.setHTMLUnsafe(markup);
      const element = container.firstElementChild as WebComponent.Element<{ value: string }>;
      document.body.append(container);
      let root: ParentNode = shadow === false ? element : (element.shadowRoot ?? element);
      let inputBefore = root.querySelector<HTMLInputElement>("input");
      if (inputBefore !== null) inputBefore.value = "early input";
      if (shadow !== false && shadow.mode === "closed") {
        const attachInternals = HTMLElement.prototype.attachInternals;
        vi.spyOn(HTMLElement.prototype, "attachInternals").mockImplementation(
          function (this: HTMLElement) {
            const internals = attachInternals.call(this);
            if (this === element) {
              root = internals.shadowRoot!;
              inputBefore = root.querySelector<HTMLInputElement>("input");
              inputBefore!.value = "early input";
            }
            return internals;
          },
        );
      }
      const errors: unknown[] = [];
      element.addEventListener("typed:error", (event) =>
        errors.push((event as CustomEvent).detail),
      );
      await Effect.runPromise(register(definition, await openScope(), shadow));
      expect(element).toBeInstanceOf(customElements.get(definition.name)!);
      element.props = { value: "client" };
      await vi.waitFor(() => {
        expect(errors).toEqual([]);
        expect(root.querySelector("label")?.textContent).toBe("client");
      });
      expect(inputBefore).not.toBeNull();
      expect(root.querySelector("input")).toBe(inputBefore);
      expect(inputBefore!.value).toBe("early input");
      expect(element.style.display).toBe("contents");
      expect(element.shadowRoot === null).toBe(shadow === false || shadow.mode === "closed");
    });
  }

  it("adopts inert DSD nodes and preserves light children for slots", async () => {
    const definition = WebComponent.make({
      name: name(),

      render: () =>
        html`<p>inside</p>
          <slot></slot>`,
    });
    const container = document.createElement("div");
    container.innerHTML = await Effect.runPromise(
      renderToHtmlString(WebComponent.server(definition, {}, html`<span>slotted</span>`)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
      ),
    );
    const element = container.firstElementChild as HTMLElement;
    const inputRoot = element.querySelector("template")!.content;
    const paragraph = inputRoot.querySelector("p");
    const child = element.querySelector("span");
    document.body.append(container);
    await Effect.runPromise(register(definition, await openScope()));
    await vi.waitFor(() => expect(element.shadowRoot?.querySelector("p")).toBe(paragraph));
    expect(element.querySelector("span")).toBe(child);
    expect(element.shadowRoot!.querySelector("slot")!.assignedElements()).toContain(child);
    expect(element.querySelector("template")).toBeNull();
  });

  it("closes subscriptions and event listeners, serializes reconnect cleanup, and closes with its registration scope", async () => {
    const scope = await openScope();
    let connections = 0;
    let finalizers = 0;
    let clicks = 0;
    const definition = WebComponent.make({
      name: name(),

      render: () =>
        Effect.gen(function* () {
          connections++;
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              finalizers++;
            }),
          );
          return html`<button
            onclick=${Effect.sync(() => {
              clicks++;
            })}
          >
            click
          </button>`;
        }),
    });
    await Effect.runPromise(register(definition, scope));
    const element = createElement(definition);
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.querySelector("button")).toBeTruthy());
    const oldButton = element.shadowRoot!.querySelector("button")!;
    oldButton.click();
    await vi.waitFor(() => expect(clicks).toBe(1));
    element.remove();
    document.body.append(element);
    element.remove();
    document.body.append(element);
    await vi.waitFor(() => expect(connections - finalizers).toBe(1));
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector("button")).not.toBe(oldButton));
    oldButton.click();
    element.shadowRoot!.querySelector("button")!.click();
    await vi.waitFor(() => expect(clicks).toBe(2));
    await Effect.runPromise(Scope.close(scope, Exit.void));
    expect(finalizers).toBe(connections);
    element.shadowRoot!.querySelector("button")!.click();
    element.remove();
    document.body.append(element);
    expect(finalizers).toBe(connections);
    expect(clicks).toBe(2);
  });

  it("waits for asynchronous cleanup through repeated disconnect/reconnect", async () => {
    const release = await Effect.runPromise(Deferred.make<void>());
    let started = 0;
    let closing = 0;
    const definition = WebComponent.make({
      name: name(),

      render: () =>
        Effect.gen(function* () {
          started++;
          yield* Effect.addFinalizer(() =>
            Effect.gen(function* () {
              closing++;
              yield* Deferred.await(release);
            }),
          );
          return html`<p>connected</p>`;
        }),
    });
    await Effect.runPromise(register(definition, await openScope()));
    const element = createElement(definition);
    try {
      document.body.append(element);
      await vi.waitFor(() => expect(started).toBe(1));
      element.remove();
      await vi.waitFor(() => expect(closing).toBe(1));
      document.body.append(element);
      element.remove();
      document.body.append(element);
      expect(started).toBe(1);
      await Effect.runPromise(Deferred.succeed(release, undefined));
      await vi.waitFor(() => expect(started).toBe(2));
    } finally {
      await Effect.runPromise(Deferred.succeed(release, undefined));
    }
  });

  it("captures application services and shadow references independently for SSR and registration", async () => {
    const Service = Context.Service<{ label: string; clicked: () => void }>("WebComponentTest");
    let clicks = 0;
    const definition = WebComponent.make({
      name: name(),

      render: () =>
        Effect.gen(function* () {
          const { label } = yield* Service;
          return html`<button
            onclick=${Effect.flatMap(Service, (value) => Effect.sync(value.clicked))}
          >
            ${label}
          </button>`;
        }),
    });
    const markup = await Effect.runPromise(
      renderToHtmlString(WebComponent.server(definition)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
        Effect.provideService(Service, { label: "server service", clicked: () => {} }),
        Effect.provideService(WebComponent.CurrentShadowRoot, false),
      ),
    );
    expect(markup).toContain("server service");
    expect(markup).not.toContain("shadowrootmode");
    const scope = await openScope();
    await Effect.runPromise(
      WebComponent.register(definition).pipe(
        Layer.buildWithScope(scope),
        Effect.provideService(Service, {
          label: "client service",
          clicked: () => {
            clicks++;
          },
        }),
        Effect.provideService(WebComponent.CurrentShadowRoot, false),
      ),
    );
    const element = createElement(definition);
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.querySelector("button")?.textContent).toBe("client service"),
    );
    expect(element.shadowRoot).toBeNull();
    element.querySelector("button")!.click();
    await vi.waitFor(() => expect(clicks).toBe(1));
    // A separately registered definition still observes the default open shadow root.
    const otherDefinition = { ...definition, name: name(), render: () => html`<p>other</p>` };
    await Effect.runPromise(register(otherDefinition, scope));
    const other = createElement(otherDefinition);
    document.body.append(other);
    await vi.waitFor(() => expect(other.shadowRoot?.textContent).toBe("other"));
  });

  for (const shadow of [false, { mode: "open" }] as const) {
    it(`scopes inherited bubbling boundaries for ${shadow === false ? "light" : "shadow"} roots`, async () => {
      let clicks = 0;
      let parentClicks = 0;
      let parentChanges = 0;
      const definition = WebComponent.make({
        name: name(),

        stopPropagation: { change: false },
        render: () =>
          html`<button
            onclick=${Effect.sync(() => {
              clicks++;
            })}
          >
            click
          </button>`,
      });
      const scope = await openScope();
      await Effect.runPromise(
        register(definition, scope, shadow).pipe(
          Effect.provideService(CurrentRootEvents, { click: true, change: true }),
        ),
      );
      const parent = document.createElement("div");
      parent.addEventListener("click", () => parentClicks++);
      parent.addEventListener("change", () => parentChanges++);
      const element = createElement(definition);
      parent.append(element);
      document.body.append(parent);
      const root = () => (shadow === false ? element : element.shadowRoot);
      await vi.waitFor(() => expect(root()?.querySelector("button")).toBeTruthy());
      const button = root()!.querySelector("button")!;
      button.click();
      await vi.waitFor(() => expect(clicks).toBe(1));
      expect(parentClicks).toBe(0);
      button.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      expect(parentChanges).toBe(1);
      await Effect.runPromise(Scope.close(scope, Exit.void));
      button.click();
      expect(parentClicks).toBe(1);
      expect(clicks).toBe(1);
    });
  }

  it("borrows the DOM renderer captured by registration", async () => {
    const scope = await openScope();
    let selected: unknown;
    const definition = WebComponent.make({
      name: name(),

      render: () =>
        Effect.map(RenderTemplate, (renderer) => {
          selected = renderer;
          return html`<p>borrowed</p>`;
        }),
    });
    const renderer = await Effect.runPromise(
      Effect.gen(function* () {
        const renderer = new Proxy(yield* RenderTemplate, {});
        yield* register(definition, scope).pipe(Effect.provideService(RenderTemplate, renderer));
        return renderer;
      }).pipe(Effect.provide(DomRenderTemplate), Effect.provideService(Scope.Scope, scope)),
    );
    const element = createElement(definition);
    document.body.append(element);
    await vi.waitFor(() => expect(element.shadowRoot?.textContent).toBe("borrowed"));
    expect(selected).toBe(renderer);
  });

  it("reports failed registration and render errors", async () => {
    const definition = WebComponent.make({
      name: name(),

      render: () => Effect.fail("render failed"),
    });
    const scope = await openScope();
    await Effect.runPromise(register(definition, scope));
    const element = createElement(definition);
    const errors: unknown[] = [];
    element.addEventListener("typed:error", (event) => errors.push((event as CustomEvent).detail));
    document.body.append(element);
    await vi.waitFor(() => expect(errors).toHaveLength(1));
    const duplicate = await Effect.runPromiseExit(register(definition, scope));
    expect(Exit.isFailure(duplicate)).toBe(true);
  });
});
