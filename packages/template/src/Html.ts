import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { isNone, isOption, none, type Option, some } from "effect/Option";
import { isNullish, isObject } from "effect/Predicate";
import { map as mapRecord } from "effect/Record";
import type { Scope } from "effect/Scope";
import * as Context from "effect/Context";
import { Fx, RefSubject } from "@typed/fx";
import {
  addTemplateHash,
  type HtmlChunk,
  type HtmlPartChunk,
  type HtmlSparsePartChunk,
  isSerializableSpreadKey,
  templateToHtmlChunks,
} from "./HtmlChunk.js";
import { renderToString } from "./internal/encoding.js";
import { TEXT_START, TYPED_NODE_END, TYPED_NODE_START } from "./internal/meta.js";
import { renderManyToHtml } from "./internal/renderManyToHtml.js";
import { takeOneIfNotRenderEvent } from "./internal/takeOneIfNotRenderEvent.js";
import { isMany } from "./many.js";
import { parse } from "./Parser.js";
import type { Renderable } from "./Renderable.js";
import { HtmlRenderEvent, isHtmlRenderEvent, type RenderEvent } from "./RenderEvent.js";
import { html as renderHtml, RenderTemplate } from "./RenderTemplate.js";
import { isStream } from "effect/Stream";
import { fromStream } from "@typed/fx/Fx";

const toHtmlString = (event: RenderEvent | null | undefined): Option<string> => {
  if (event === null || event === undefined) return none();
  const s = event.toString();
  if (s === "") return none();
  return some(s);
};

/**
 * Renders a stream of `RenderEvent`s into a stream of HTML strings.
 *
 * This function transforms the output of a template rendering process (which produces `RenderEvent`s)
 * into a stream of strings suitable for HTML output (e.g., for Server-Side Rendering).
 *
 * @remarks
 * ## Why
 *
 * This keeps SSR push-based: each ordered renderer-owned HTML event becomes an
 * output chunk as it arrives. Unlike DOM rendering, dynamic inputs use the
 * HTML layer's single-value computed behavior and do not remain live.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx owns no response by itself. Its running Effect Scope owns
 * subscriptions and interruption; the caller owns the HTTP response or other
 * sink consuming the strings. Typed errors and required services are preserved.
 *
 * ## Trust boundary
 *
 * Ordinary dynamic template data is contextually escaped. Branded
 * `HtmlRenderEvent` values are trusted renderer output, not a raw-HTML API.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { renderToHtml, HtmlRenderTemplate } from "@typed/template/Html"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const template = html`<div>Hello, ${"world"}!</div>`
 *
 *   // Render to HTML string stream
 *   const htmlStream = renderToHtml(template).pipe(
 *     Fx.provide(HtmlRenderTemplate)
 *   )
 *
 *   // Collect all HTML chunks
 *   const chunks = yield* Fx.collectAll(htmlStream)
 *   console.log(chunks.join("")) // "<div>Hello, world!</div>"
 * }))
 * ```
 *
 * @param renderable - The RenderEvents to render.
 * @returns An `Fx` stream of HTML strings.
 * @since 1.0.0
 * @category Streaming HTML
 */
export function renderToHtml<const T extends Renderable.Any>(
  renderable: T,
): Fx.Fx<string, Renderable.Error<T>, Renderable.Services<T>> {
  return Fx.filterMap(
    liftRenderableToFx<Renderable.Error<T>, Renderable.Services<T>>(renderable, true),
    toHtmlString,
  );
}

/**
 * Renders a stream of `RenderEvent`s into a single HTML string.
 *
 * This is a convenience function that collects all events from `renderToHtml` and joins them
 * into a single string. It is an Effect that resolves when the stream completes.
 *
 * @remarks
 * ## Why
 *
 * This is the finite-response convenience over `renderToHtml`: it preserves
 * ordered chunks but buffers them when the caller needs one complete body.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect runs and finalizes the source Fx. The resulting string is
 * caller-owned; errors and required services remain in the Effect type.
 *
 * ## Cost model
 *
 * Collection requires memory proportional to the complete rendered response.
 * Prefer `renderToHtml` when the transport can stream chunks.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { renderToHtmlString, HtmlRenderTemplate } from "@typed/template/Html"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const template = html`<div>
 *     <h1>Hello</h1>
 *     <p>World</p>
 *   </div>`
 *
 *   // Render to single HTML string
 *   const htmlString = yield* renderToHtmlString(template).pipe(
 *     Effect.provide(HtmlRenderTemplate)
 *   )
 *
 *   console.log(htmlString)
 *   // "<div><h1>Hello</h1><p>World</p></div>"
 * }))
 * ```
 *
 * @param renderable - The RenderEvents to render.
 * @returns An `Effect` that resolves to the full HTML string.
 * @since 1.0.0
 * @category Buffered HTML
 */
export function renderToHtmlString<const T extends Renderable.Any>(
  renderable: T,
): Effect.Effect<string, Renderable.Error<T>, Renderable.Services<T>> {
  return renderToHtml(renderable).pipe(
    Fx.collectAll,
    Effect.map((events) => events.join("")),
  );
}

/**
 * A boolean service that indicates whether the current rendering context is static.
 *
 * If `true`, the HTML renderer will optimize for static output, potentially skipping
 * dynamic placeholder generation or other interactive features not needed for static HTML.
 *
 * @remarks
 * ## Why
 *
 * Static and hydratable SSR share one renderer while making marker generation
 * an explicit service choice.
 *
 * ## Ownership and lifetime
 *
 * The reference has a default of `false` and owns no resource. A provided value
 * is scoped by the surrounding Effect context.
 *
 * @example
 * ```ts
 * import { StaticRendering } from "@typed/template/Html"
 * import { Effect } from "effect"
 *
 * const isStatic = Effect.runSync(StaticRendering)
 * ```
 *
 * @since 1.0.0
 * @category HTML rendering policy
 */
export const StaticRendering = Context.Reference<boolean>("@typed/template/Html/StaticRendering", {
  defaultValue: () => false,
});

type HtmlEntry = ReadonlyArray<HtmlChunk>;

/**
 * A Layer that provides the `RenderTemplate` service implemented for HTML string generation.
 *
 * Using this layer enables templates to be rendered as HTML strings (e.g., for SSR)
 * rather than DOM nodes. It sets the `RefSubject.CurrentComputedBehavior` to `"one"`, indicating
 * a single-pass render approach typical for HTML generation.
 *
 * @remarks
 * ## Why
 *
 * The Layer supplies the same `RenderTemplate` service consumed by `html`, so
 * templates are renderer-independent while SSR remains an ordered Fx of chunks.
 * Parsed templates and compiled chunks are cached by template-literal identity.
 *
 * ## Ownership and lifetime
 *
 * The provided service and its caches live for the Layer Scope. Each rendered
 * Fx owns its dynamic subscriptions until completion or interruption. The layer
 * intentionally selects the first value from live sources for finite SSR.
 *
 * ## Trust boundary
 *
 * Literal segments are author markup. Dynamic text and attributes are escaped;
 * event, ref, property, prototype-sensitive, and unsafe spread keys are not
 * serialized as HTML.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { renderToHtmlString, HtmlRenderTemplate } from "@typed/template/Html"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const template = html`<div>Hello, ${"world"}!</div>`
 *
 *   const htmlString = yield* renderToHtmlString(template).pipe(
 *     Effect.provide(HtmlRenderTemplate)
 *   )
 *
 *   // Use for SSR
 *   return htmlString
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Hydratable HTML rendering
 */
export const HtmlRenderTemplate = Layer.effect(
  RenderTemplate,
  Effect.gen(function* () {
    const isStatic = yield* StaticRendering;
    const entries = new WeakMap<TemplateStringsArray, HtmlEntry>();
    const getChunks = (templateStrings: TemplateStringsArray) => {
      let entry = entries.get(templateStrings);
      if (entry === undefined) {
        const template = parse(templateStrings);
        const chunks = templateToHtmlChunks(template);
        entry = isStatic ? chunks : addTemplateHash(chunks, template);
        entries.set(templateStrings, entry);
      }
      return entry;
    };

    return <const Values extends ArrayLike<Renderable.Any>>(
      template: TemplateStringsArray,
      values: Values,
    ) =>
      Fx.mergeOrdered(
        ...getChunks(template).map((chunk, i, chunks) =>
          renderChunk<Renderable.Error<Values[number]>, Renderable.Services<Values[number]>>(
            chunk,
            values,
            isStatic,
            i === chunks.length - 1,
          ),
        ),
      );
  }),
).pipe(Layer.provideMerge(Layer.succeed(RefSubject.CurrentComputedBehavior, "one")));

/**
 * A variant of `HtmlRenderTemplate` that enables static rendering optimizations.
 *
 * This layer provides the `RenderTemplate` service for HTML generation but also
 * sets `StaticRendering` to `true`, enabling optimizations for static content.
 *
 * @remarks
 * ## Why
 *
 * Static output omits hydration markers when no client adoption contract is
 * needed, while retaining the same escaping and ordering rules.
 *
 * ## Ownership and lifetime
 *
 * Like `HtmlRenderTemplate`, service caches are Layer-scoped and each render is
 * finalized by the Scope running its Fx.
 *
 * @example
 * ```ts
 * import { StaticHtmlRenderTemplate } from "@typed/template/Html"
 * import { html } from "@typed/template"
 * import { renderToHtmlString } from "@typed/template/Html"
 * import { Effect } from "effect"
 *
 * const output = Effect.runPromise(Effect.scoped(
 *   renderToHtmlString(html`<p>ready</p>`).pipe(
 *     Effect.provide(StaticHtmlRenderTemplate)
 *   )
 * ))
 * ```
 *
 * @since 1.0.0
 * @category Static HTML rendering
 */
export const StaticHtmlRenderTemplate = HtmlRenderTemplate.pipe(
  Layer.provideMerge(Layer.succeed(StaticRendering, true)),
);

function renderChunk<E, R>(
  chunk: HtmlChunk,
  values: ArrayLike<Renderable.Any>,
  isStatic: boolean,
  last: boolean,
): Fx.Fx<HtmlRenderEvent, E, R | Scope> {
  if (chunk._tag === "text") {
    return Fx.succeed(HtmlRenderEvent(chunk.text, last));
  }

  if (chunk._tag === "part") {
    return renderPart<E, R>(chunk, values, isStatic, last);
  }

  return renderSparsePart(chunk, values, isStatic, last);
}

function renderPart<E, R>(
  chunk: HtmlPartChunk,
  values: ArrayLike<Renderable.Any>,
  isStatic: boolean,
  last: boolean,
): Fx.Fx<HtmlRenderEvent, E, R | Scope> {
  const { node, render } = chunk;
  const renderable = values[node.index];

  if (node._tag === "event") return Fx.empty;

  if (node._tag === "ref") {
    if (RefSubject.isHydrationRef(renderable))
      return renderHydrationRef(renderable, isStatic, last, render);
    return Fx.empty;
  }

  // Node need to handle all possible value types including arrays
  if (node._tag === "node") {
    return renderNode(renderable, node.index, isStatic, last, render);
  }

  // Properties is entirely recursive
  if (node._tag === "properties") {
    const setup = (props: unknown) =>
      setupProperties<E, R>(props as Record<string, Renderable<any, E, R>>, isStatic, last, render);
    if (isObject(renderable) && !isEffectLike(renderable)) {
      return setup(renderable);
    }
    return Fx.switchMap(
      liftRenderableToFx<E, R>(renderable, isStatic, undefined, false),
      (props) => {
        if (isObject(props)) return setup(props);
        return Fx.empty;
      },
    );
  }

  // Otherwise we're going to coerce to a string
  return Fx.filterMap(
    liftRenderableToFx<E, R>(
      renderable,
      isStatic,
      undefined,
      false,
      node._tag === "className-part",
    ),
    (value) => {
      const s = render(value);
      return s ? some(HtmlRenderEvent(s, last)) : none();
    },
  );
}

function isEffectLike(value: object): boolean {
  return Effect.isEffect(value) || Fx.isFx(value) || isStream(value) || isOption(value);
}

function setupProperties<E, R>(
  renderable: Record<string, Renderable<any, E, R>>,
  isStatic: boolean,
  last: boolean,
  render: (u: Record<string, unknown>) => string,
) {
  const entries = Object.entries(renderable);
  const length = entries.length;
  const lastIndex = length - 1;

  // Order here doesn't matter ??
  return Fx.mergeAll(
    ...entries.map(([key, renderable], i) => {
      if (key === "ref" && RefSubject.isHydrationRef(renderable)) {
        return renderHydrationRef(renderable, isStatic, last && i === lastIndex, (attributes) =>
          render(Object.fromEntries(attributes.map(({ name, value }) => [name, value]))),
        );
      }
      if (!isSerializableSpreadKey(key)) return Fx.empty;
      return Fx.filterMap(
        liftRenderableToFx<E, R>(renderable, isStatic, new Set(), false),
        (value) => {
          const s = render({ [key]: value });
          return s ? some(HtmlRenderEvent(s, last && i === lastIndex)) : none();
        },
      );
    }),
  );
}

function renderHydrationRef<E, R>(
  ref: RefSubject.HydrationRef<E, R>,
  isStatic: boolean,
  last: boolean,
  render: (attributes: ReadonlyArray<RefSubject.HydrationAttribute>) => string,
): Fx.Fx<HtmlRenderEvent, E, R | Scope> {
  if (isStatic) return Fx.make(() => ref[RefSubject.HydrationRefTypeId].server);
  return Fx.unwrap(
    Effect.map(ref[RefSubject.HydrationRefTypeId].toAttributes, (attributes) => {
      const html = render(attributes);
      return html === "" ? Fx.empty : Fx.succeed(HtmlRenderEvent(html, last));
    }),
  );
}

function renderNode<E, R>(
  renderable: Renderable<any, E, R>,
  index: number,
  isStatic: boolean,
  last: boolean,
  render: HtmlPartChunk["render"],
) {
  let node = (
    isMany(renderable)
      ? renderManyToHtml(renderable)
      : liftRenderableToFx<E, R>(renderable, isStatic)
  ).pipe(
    Fx.map((value) => (isHtmlRenderEvent(value) ? value : HtmlRenderEvent(render(value), last))),
  );
  if (!isStatic) {
    node = addNodePlaceholders<E, R>(node, index);
  }
  return node.pipe(Fx.map((x) => HtmlRenderEvent(x.html, x.last && last)));
}

function addNodePlaceholders<E, R>(
  fx: Fx.Fx<HtmlRenderEvent, E, R>,
  index: number,
): Fx.Fx<HtmlRenderEvent, E, R> {
  return fx.pipe(
    Fx.map((event) => (isHtmlRenderEvent(event) ? HtmlRenderEvent(event.html, false) : event)),
    Fx.delimit(
      HtmlRenderEvent(TYPED_NODE_START(index), false),
      HtmlRenderEvent(TYPED_NODE_END(index), true),
    ),
  );
}

function renderSparsePart<E, R>(
  chunk: HtmlSparsePartChunk,
  values: ArrayLike<Renderable.Any>,
  isStatic: boolean,
  last: boolean,
): Fx.Fx<HtmlRenderEvent, E, R> {
  const { node, render } = chunk;
  return Fx.tuple(
    ...node.nodes.map((node) => {
      if (node._tag === "text") return Fx.succeed(node.value);
      const value = liftRenderableToFx<E, R>(
        values[node.index],
        isStatic,
        undefined,
        false,
        chunk.node._tag === "sparse-class-name",
      );
      return chunk.node._tag === "sparse-class-name"
        ? Fx.map(value, (value) => renderToString(value, " "))
        : value;
    }),
  ).pipe(
    Fx.take(1),
    Fx.map((value) => HtmlRenderEvent(render(value), last)),
  );
}

function liftRenderableToFx<E, R>(
  renderable: Renderable<unknown, E, R>,
  isStatic: boolean,
  propertyAncestors?: ReadonlySet<object>,
  nodeContext = true,
  classContext = false,
): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "function":
      return Fx.isFx(renderable)
        ? takeOneIfNotRenderEvent(renderable)
        : !nodeContext
          ? Fx.succeed(undefined)
          : isStatic
            ? Fx.empty
            : Fx.succeed(HtmlRenderEvent(TEXT_START, true));
    case "undefined":
    case "object": {
      if (isNullish(renderable)) {
        // Empty node positions need a hydration marker; attribute serializers need the absent value.
        return !nodeContext
          ? Fx.succeed(renderable)
          : isStatic
            ? Fx.empty
            : Fx.succeed(HtmlRenderEvent(TEXT_START, true));
      } else if (isMany(renderable)) {
        return renderHtml`${renderable}` as Fx.Fx<any, E, R>;
      } else if (Array.isArray(renderable)) {
        const ancestors = addPropertyAncestor(renderable, propertyAncestors);
        if (ancestors === null) return Fx.empty;
        const children = renderable.map((r) =>
          liftRenderableToFx<E, R>(r, isStatic, ancestors, nodeContext, classContext),
        );
        // A class collection is one attribute value, not a sequence of HTML chunks.
        return classContext ? Fx.tuple(...children) : Fx.mergeOrdered(...children);
      } else if (isOption(renderable)) {
        return isNone(renderable)
          ? classContext
            ? Fx.succeed(undefined)
            : Fx.empty
          : liftRenderableToFx(
              renderable.value,
              isStatic,
              propertyAncestors,
              nodeContext,
              classContext,
            );
      } else if (isStream(renderable)) {
        return takeOneIfNotRenderEvent(fromStream(renderable)) as Fx.Fx<any, E, R>;
      } else if (Fx.isFx(renderable)) {
        return takeOneIfNotRenderEvent(renderable);
      } else if (Effect.isEffect(renderable)) {
        return Fx.unwrap(
          Effect.map(renderable, (r) =>
            liftRenderableToFx<E, R>(r, isStatic, propertyAncestors, nodeContext, classContext),
          ),
        );
      } else if (isHtmlRenderEvent(renderable)) {
        return Fx.succeed(renderable);
      } else {
        const ancestors = addPropertyAncestor(renderable, propertyAncestors);
        if (ancestors === null) return Fx.empty;
        return Fx.take(
          Fx.struct(
            mapRecord(renderable, (_) =>
              liftRenderableToFx<E, R>(_, isStatic, ancestors, nodeContext, classContext),
            ),
          ),
          1,
        );
      }
    }
    default:
      return Fx.succeed(renderable);
  }
}

function addPropertyAncestor<T extends object>(
  value: T,
  ancestors: ReadonlySet<object> | undefined,
): ReadonlySet<object> | null | undefined {
  if (ancestors === undefined) return undefined;
  if (ancestors.has(value)) return null;
  return new Set(ancestors).add(value);
}
