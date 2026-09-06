import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { constVoid, dual, flow, identity } from "effect/Function";
import * as Layer from "effect/Layer";
import { isNone, isOption, type Some } from "effect/Option";
import { isFunction, isNullish, isObject } from "effect/Predicate";
import { map as mapRecord } from "effect/Record";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { isStream, type Stream } from "effect/Stream";
import { Fx, RefSubject, Sink } from "@typed/fx";
import { CouldNotFindCommentError, isHydrationError } from "./errors.js";
import * as EventHandler from "./EventHandler.js";
import { type EventSource, makeEventSource } from "./EventSource.js";
import { HydrateContext, makeHydrateContext } from "./HydrateContext.js";
import {
  buildTemplateFragment,
  getAttributeDescriptor,
  getInsertionNamespace,
  HTML_NAMESPACE,
  type NamespaceContext,
} from "./internal/buildTemplateFragment.js";
import {
  findNodePartEndComment,
  getClassList,
  makeAttributeValueUpdater,
  makeBooleanUpdater,
  makeClassListUpdater,
  makeDatasetUpdater,
  makeNodeUpdater,
  makeTextContentUpdater,
  renderEventToArray,
} from "./internal/dom.js";
import { renderToString } from "./internal/encoding.js";
import type { HydrationHole, HydrationNode, HydrationTemplate } from "./internal/hydration.js";
import {
  findHydratePath,
  findHydrationHole,
  findHydrationTemplateByHash,
  getChildNodes,
  getRendered,
} from "./internal/hydration.js";
import { type IndexRefCounter, makeRefCounter } from "./internal/IndexRefCounter.js";
import { keyToPartType } from "./internal/keyToPartType.js";
import { findPath } from "./internal/ParentChildNodes.js";
import { renderManyToDom } from "./internal/renderManyToDom.js";
import { isMany } from "./many.js";
import { parse } from "./Parser.js";
import type { Renderable } from "./Renderable.js";
import { DomRenderEvent, isRenderEvent, type RenderEvent } from "./RenderEvent.js";
import * as RQ from "./RenderQueue.js";
import { html as renderHtml, RenderTemplate } from "./RenderTemplate.js";
import * as Template from "./Template.js";
import { getAllSiblingsBetween, isText, persistent, type Rendered } from "./Wire.js";

// Can be utilized to override the document for rendering
/**
 * A service that provides the `Document` interface for rendering.
 *
 * Defaults to the global `document` object. This can be overridden for testing
 * or environments where the global document is not available or desired.
 *
 * @remarks
 * ## Why
 *
 * DOM creation is an explicit Effect service so tests, iframes, and alternate
 * documents can use the same renderer without patching `globalThis.document`.
 *
 * ## Ownership and lifetime
 *
 * The reference borrows the provided `Document`; it does not own or close the
 * browsing context. The surrounding Layer controls how long the override lives.
 *
 * @example
 * ```ts
 * import { CurrentRenderDocument } from "@typed/template/Render"
 * import { Layer } from "effect"
 *
 * // Override document for testing
 * const testDocument = new Document()
 * const testLayer = Layer.succeed(CurrentRenderDocument, testDocument)
 * ```
 *
 * @since 1.0.0
 * @category DOM document selection
 */
export const CurrentRenderDocument = Context.Reference<Document>("RenderDocument", {
  defaultValue: () => document,
});

const CurrentInsertionContext = Context.Reference<Element | undefined>("RenderInsertionContext", {
  defaultValue: () => undefined,
});

/**
 * A service that manages the queue of DOM updates.
 *
 * It ensures that DOM updates are batched and executed efficiently, often coordinating
 * with browser painting cycles (e.g., via `requestAnimationFrame`).
 *
 * @remarks
 * ## Why
 *
 * Scheduling policy is separate from template semantics. Scalar parts retain
 * direct DOM targets while the queue decides when their already-local updates
 * execute.
 *
 * ## Ownership and lifetime
 *
 * The default queue is created lazily for the current Effect context. Queue
 * callbacks are disposable and render Scopes cancel pending work on cleanup.
 *
 * @example
 * ```ts
 * import { CurrentRenderQueue } from "@typed/template/Render"
 * import { MixedRenderQueue } from "@typed/template/RenderQueue"
 * import { Layer } from "effect"
 *
 * // Use a custom render queue
 * const customQueue = new MixedRenderQueue()
 * const queueLayer = Layer.succeed(CurrentRenderQueue, customQueue)
 * ```
 *
 * @since 1.0.0
 * @category Render scheduling
 */
export const CurrentRenderQueue = Context.Reference<RQ.RenderQueue>("RenderQueue", {
  defaultValue: () => new RQ.MixedRenderQueue(),
});

/**
 * A service that provides the default priority for rendering tasks.
 *
 * The default value is `RenderPriority.Raf(10)`, which typically schedules updates
 * to occur before the next repaint.
 *
 * @remarks
 * ## Why
 *
 * A numeric priority lets one queue order synchronous, animation-frame, timer,
 * and idle work without embedding scheduler policy in each directive.
 *
 * ## Ownership and lifetime
 *
 * The service is immutable scheduling metadata and owns no callback.
 *
 * @example
 * ```ts
 * import { CurrentRenderPriority } from "@typed/template/Render"
 * import { RenderPriority } from "@typed/template/RenderQueue"
 * import { Layer } from "effect"
 *
 * // Use synchronous priority for immediate updates
 * const syncLayer = Layer.succeed(CurrentRenderPriority, RenderPriority.Sync)
 * ```
 *
 * @since 1.0.0
 * @category Render scheduling
 */
export const CurrentRenderPriority = Context.Reference<number>("CurrentRenderPriority", {
  defaultValue: () => RQ.RenderPriority.Raf(10),
});

/**
 * A Layer that provides the `RenderTemplate` service implemented for DOM rendering.
 *
 * This layer enables templates to be rendered as actual DOM nodes. It handles:
 * - Parsing templates into DOM fragments.
 * - Caching parsed templates.
 * - Hydrating from existing DOM (if applicable).
 * - Setting up event listeners.
 * - Managing fine-grained updates to DOM nodes via `Fx` streams.
 *
 * @remarks
 * ## Why
 *
 * The Layer is the DOM implementation of the same `RenderTemplate` service used
 * by SSR. It compiles a literal once, clones namespace-correct fragments, and
 * connects each captured part directly to its producer—there is no virtual DOM
 * or component-specific event state. Delegated handlers receive EventSource's
 * documented native-event Proxy so `currentTarget` can identify their target.
 *
 * ## Ownership and lifetime
 *
 * Template and fragment caches live with the Layer service. Each emitted DOM
 * range keeps its mounted subscriptions, delegated native listeners, queued
 * callbacks, and ref finalizers in the surrounding event Scope. Replaceable
 * spread parts use child Scopes so replacement still releases their resources.
 * Only nodes and attributes represented by that range are changed; external
 * classes and unowned siblings remain intact.
 *
 * ## Cost model and moves
 *
 * Captured scalar text, attribute, property, boolean, comment, and ref parts
 * update their retained target in O(1) with respect to the surrounding tree.
 * Structural changes diff only the local dynamic range. Moving an already
 * connected node prefers `ParentNode.moveBefore` and falls back to
 * `insertBefore`, preserving DOM identity and browser state.
 *
 * ## Web standards
 *
 * HTML, SVG, MathML, and foreign-content namespace boundaries are compiled with
 * native DOM APIs. Dialog, popover, anchor positioning, custom elements, and
 * browser event behavior remains available through EventSource's forwarding
 * Proxy because the renderer does not replace the platform event model.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { html } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const template = html`<div>Hello, world!</div>`
 *
 *   return yield* render(template, document.body).pipe(
 *     Fx.drainLayer,
 *     Layer.provide(DomRenderTemplate),
 *     Layer.launch
 *   )
 * })
 * ```
 *
 * @since 1.0.0
 * @category DOM template interpretation
 */
export const DomRenderTemplate = Object.assign(
  Layer.effect(
    RenderTemplate,
    Effect.gen(function* () {
      const document = yield* CurrentRenderDocument;
      const entries = new WeakMap<
        TemplateStringsArray,
        {
          template: Template.Template;
          fragments: Map<NamespaceContext, DocumentFragment>;
        }
      >();
      const getEntry = (templateStrings: TemplateStringsArray) => {
        let entry = entries.get(templateStrings);
        if (entry === undefined) {
          entry = { template: parse(templateStrings), fragments: new Map() };
          entries.set(templateStrings, entry);
        }
        return entry;
      };

      return <const Values extends ArrayLike<Renderable.Any>>(
        templateStrings: TemplateStringsArray,
        values: Values,
      ): Fx.Fx<
        RenderEvent,
        Renderable.Error<Values[number]>,
        Renderable.Services<Values[number]> | Scope.Scope
      > =>
        Fx.make<
          RenderEvent,
          Renderable.Error<Values[number]>,
          Renderable.Services<Values[number]> | Scope.Scope
        >(function render<RSink = never>(
          sink: Sink.Sink<RenderEvent, Renderable.Error<Values[number]>, RSink>,
        ): Effect.Effect<
          unknown,
          never,
          Renderable.Services<Values[number]> | Scope.Scope | RSink
        > {
          return Effect.gen(function* () {
            const entry = getEntry(templateStrings);
            const template = entry.template;
            const ctx = yield* makeTemplateContext<Values, RSink>(document, values, sink.onFailure);

            return yield* Effect.gen(function* () {
              const hydration = attemptHydration(ctx, template.hash);

              let setup: PartSetup;
              let rendered: Rendered | undefined;
              let fragment: DocumentFragment | undefined;

              if (hydration) {
                setup = setupHydrationParts(template.parts, ctx, hydration.where);
              } else {
                const insertionContext = yield* CurrentInsertionContext;
                const namespace = getInsertionNamespace(insertionContext);
                let cachedFragment = entry.fragments.get(namespace);
                if (cachedFragment === undefined) {
                  cachedFragment = buildTemplateFragment(document, template, namespace);
                  entry.fragments.set(namespace, cachedFragment);
                }
                fragment = document.importNode(cachedFragment, true);
                setup = setupRenderParts(template.parts, fragment, ctx);
              }

              if (setup.hydration.length > 0) {
                yield* Effect.all(setup.hydration, { concurrency: 1 }).pipe(
                  Effect.catchCause(ctx.onCause),
                );
              }

              if (setup.remaining.length > 0) {
                yield* Effect.all(
                  setup.remaining.map(
                    flow(Effect.catchCause(ctx.onCause), Effect.forkIn(ctx.eventScope)),
                  ),
                );

                if (ctx.expected > 0 && ctx.refCounter.expect(ctx.expected)) {
                  yield* ctx.refCounter.wait;
                }
              }

              // Hydrated holes may replace or reorder their children during setup.
              if (hydration) rendered = getRendered(hydration.where);

              // If we have more than one child, we need to wrap them in a PersistentDocumentFragment
              // so they can be diffed within other templates more than once.
              const output = rendered ?? persistent(document, template.hash, fragment!);

              // Setup our event listeners for our rendered content.
              yield* ctx.eventSource.setup(output, ctx.eventScope);

              // If we're hydrating, we need to mark this part of the stack as hydrated
              if (hydration !== undefined) {
                hydration.hydrateCtx.hydrate = false;
              }

              // Emit just once
              yield* sink.onSuccess(DomRenderEvent(output));

              // Ensure our templates last forever in the DOM environment
              // so event listeners are kept attached to the current Scope.
              return yield* Effect.never.pipe(
                // Close our scope whenever the current Fiber is interrupted
                Effect.onExit((exit) => Scope.close(ctx.scope, exit)),
              );
            }).pipe(
              Effect.catchDefect((defect) => {
                // If we are hydrating and we have a hydration error, we need to re-render the template without hydration
                if (ctx.hydrateContext && ctx.hydrateContext.hydrate && isHydrationError(defect)) {
                  ctx.hydrateContext.hydrate = false;
                  return Scope.close(ctx.scope, Exit.die(defect)).pipe(
                    Effect.andThen(render(sink)),
                  );
                }
                return sink.onFailure(Cause.die(defect));
              }),
            );
          });
        });
    }),
  ),
  {
    using: (document: Document) =>
      DomRenderTemplate.pipe(Layer.provide(Layer.succeed(CurrentRenderDocument, document))),
  } as const,
);

/**
 * Computes the DOM value represented by a nullable `RenderEvent`.
 *
 * @remarks
 * ## Why
 *
 * Root rendering preserves `null` in the public result when a source can render
 * nothing, while non-null events expose their actual `Rendered` nodes.
 *
 * ## Ownership and lifetime
 *
 * This type-level projection does not own the nodes it describes.
 *
 * @example
 * ```ts
 * import type { ToRendered } from "@typed/template/Render"
 * import type { DomRenderEvent } from "@typed/template/RenderEvent"
 *
 * type Output = ToRendered<DomRenderEvent>
 * ```
 *
 * @since 1.0.0
 * @category DOM output inference
 */
export type ToRendered<T extends RenderEvent | null> = Rendered | (T extends null ? null : never);

type ToRenderedRenderable<T> =
  T extends Fx.Fx<infer A, any, any>
    ? A extends RenderEvent | null
      ? ToRendered<A>
      : Rendered | null
    : Rendered | null;

/**
 * Mounts any `Renderable` to a specific DOM element.
 *
 * This function lifts primitives, arrays, Effects, Streams, and Fx values into a
 * render stream and keeps the target DOM element updated. It handles:
 * - Mounting the initial content.
 * - Updating the content as new events are emitted.
 * - Hydrating the content if hydration context is provided.
 *
 * @remarks
 * ## Why
 *
 * `render` makes the root ownership boundary explicit. It connects any
 * `Renderable` to one concrete element while preserving the Renderable's typed
 * failures and Effect service requirements. The source can be a primitive,
 * template, Effect, Stream, Fx, or existing RenderEvent.
 *
 * ## Ownership and lifetime
 *
 * Calling `render` returns an Fx and starts no work. The Scope that runs that Fx
 * owns dynamic subscriptions and cleanup. The renderer tracks only the rendered
 * value associated with `where`; it does not claim the document, overwrite
 * unrelated class names, or remove nodes outside its dynamic ownership.
 *
 * ## DOM updates and hydration
 *
 * Scalar template parts retain direct targets and update without traversing a
 * virtual tree. Structural output reconciles only its bounded range. Existing
 * server-rendered nodes can be hydrated through `HydrateContext` instead of
 * replaced, preserving their identity and native browser state.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { html } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 * import { Fx } from "@typed/fx"
 * import { RefSubject } from "@typed/fx/RefSubject"
 *
 * const program = Effect.gen(function* () {
 *   const count = yield* RefSubject.make(0)
 *
 *   const template = html`<div>
 *     <p>Count: ${count}</p>
 *     <button onclick=${RefSubject.increment(count)}>Increment</button>
 *   </div>`
 *
 *   // Render to document.body
 *   return yield* render(template, document.body).pipe(
 *     Fx.drainLayer,
 *     Layer.provide(DomRenderTemplate),
 *     Layer.launch
 *   )
 * })
 *
 * // Can also use pipe syntax
 * const program2 = Effect.gen(function* () {
 *   const template = html`<div>Hello</div>`
 *
 *   yield* template.pipe(
 *     render(document.body),
 *     Fx.drainLayer,
 *     Layer.provide(DomRenderTemplate),
 *     Layer.launch
 *   )
 * })
 * ```
 *
 * @param renderable - The content to render.
 * @param where - The target DOM element to render into.
 * @returns An `Fx` that emits the currently rendered DOM nodes.
 * @since 1.0.0
 * @category DOM mounting
 */
export const render: {
  (
    where: HTMLElement,
  ): <const T extends Renderable.Any>(
    renderable: T,
  ) => Fx.Fx<ToRenderedRenderable<T>, Renderable.Error<T>, Renderable.Services<T>>;
  <const T extends Renderable.Any>(
    renderable: T,
    where: HTMLElement,
  ): Fx.Fx<ToRenderedRenderable<T>, Renderable.Error<T>, Renderable.Services<T>>;
} = dual(2, function render<
  const T extends Renderable.Any,
>(renderable: T, rootElement: HTMLElement): Fx.Fx<
  ToRenderedRenderable<T>,
  Renderable.Error<T>,
  Renderable.Services<T>
> {
  const rendered = liftRenderableToFx(renderable);

  return Fx.provide(
    Fx.mapEffect(rendered, (what) => attachRoot(rootElement, what)),
    Layer.syncContext(() => makeHydrateContext(rootElement)),
  ) as Fx.Fx<ToRenderedRenderable<T>, Renderable.Error<T>, Renderable.Services<T>>;
});

const renderCache = new WeakMap<HTMLElement, Rendered | null>();
function attachRoot(where: HTMLElement, what: unknown): Effect.Effect<Rendered | null> {
  return Effect.sync(() => {
    const values = renderEventToArray(where.ownerDocument, what) as ReadonlyArray<Rendered>;
    const rendered: Rendered | null =
      values.length === 0 ? null : values.length === 1 ? values[0] : values;
    const previous = renderCache.get(where);
    if (rendered !== previous) {
      if (previous && !rendered) removeChildren(where, previous);
      renderCache.set(where, rendered);
      if (rendered) replaceChildren(where, rendered);
      return rendered;
    }

    return previous;
  });
}

function removeChildren(where: HTMLElement, previous: Rendered) {
  for (const node of getNodesFromRendered(previous)) {
    where.removeChild(node);
  }
}

function replaceChildren(where: HTMLElement, wire: Rendered) {
  const nodes = getNodesFromRendered(wire);
  const current = Array.from(where.childNodes);
  let index = 0;
  for (const node of current) {
    if (node === nodes[index]) index++;
  }
  // Hydration adopts nodes already in place. Removing only the surrounding
  // markers preserves focus and other browser-owned state inside those nodes.
  if (index === nodes.length) {
    const retained = new Set(nodes);
    for (const node of current) {
      if (!retained.has(node)) where.removeChild(node);
    }
  } else {
    where.replaceChildren(...nodes);
  }
}

function getNodesFromRendered(rendered: Rendered): Array<globalThis.Node> {
  if (Array.isArray(rendered)) return rendered.flatMap(getNodesFromRendered);
  const value = rendered.valueOf() as globalThis.Node | Array<globalThis.Node>;
  return Array.isArray(value) ? value.flatMap(getNodesFromRendered) : [value];
}

function setupRenderParts(
  parts: Template.Template["parts"],
  fragment: DocumentFragment,
  ctx: TemplateContext,
): PartSetup {
  const setup = makePartSetup();
  for (const [part, path] of parts) {
    const effect = setupRenderPart(part, findPath(fragment, path), ctx);
    if (effect !== undefined) {
      addPartEffect(setup, part, effect, ctx);
    }
  }

  return setup;
}

type PartSetup = {
  readonly hydration: Array<Effect.Effect<unknown, any, any>>;
  readonly remaining: Array<Effect.Effect<unknown, any, any>>;
};

type PropertiesPartEffect = {
  readonly effect: Effect.Effect<unknown, any, any>;
  readonly hydration: Effect.Effect<void, any, any>;
};

function makePartSetup(): PartSetup {
  return { hydration: [], remaining: [] };
}

function addPartEffect(
  setup: PartSetup,
  part: Template.PartNode | Template.SparsePartNode,
  effect: Effect.Effect<unknown, any, any> | PropertiesPartEffect,
  ctx: TemplateContext,
): void {
  if (isPropertiesPartEffect(effect)) {
    setup.hydration.push(effect.hydration);
    setup.remaining.push(effect.effect);
    return;
  }
  const hydration = part._tag === "ref" && RefSubject.isHydrationRef(ctx.values[part.index]);
  (hydration ? setup.hydration : setup.remaining).push(effect);
}

function isPropertiesPartEffect(
  effect: Effect.Effect<unknown, any, any> | PropertiesPartEffect,
): effect is PropertiesPartEffect {
  return "hydration" in effect;
}

const withCurrentRenderPriority = (
  key: unknown,
  index: number,
  ctx: TemplateContext,
  f: () => void,
) => {
  return Effect.tap(Effect.service(CurrentRenderPriority), (priority) =>
    Effect.sync(() => {
      let removeFromContext = constVoid;
      let completed = false;
      const scheduled = ctx.renderQueue.add(
        key,
        () => {
          f();
          ctx.refCounter.release(index);
        },
        () => {
          completed = true;
          removeFromContext();
        },
        priority,
      );
      if (!completed) removeFromContext = addDisposable(ctx, scheduled);
    }),
  );
};

function setupRenderPart<E = never, R = never>(
  part: Template.PartNode | Template.SparsePartNode,
  node: Node,
  ctx: TemplateContext<R>,
): Effect.Effect<unknown, E, R> | PropertiesPartEffect | void {
  switch (part._tag) {
    case "node": {
      const endComment = findNodePartEndComment(node as HTMLElement | SVGElement, part.index);
      const renderable = ctx.values[part.index];
      if (isMany(renderable)) {
        const effect = renderManyToDom(renderable, endComment, part.index, ctx) as Effect.Effect<
          unknown,
          E,
          R
        >;
        return endComment.parentElement === null
          ? effect
          : Effect.provideService(effect, CurrentInsertionContext, endComment.parentElement);
      }
      const effect = renderValue<E, R, void>(
        ctx,
        part.index,
        makeNodeUpdater(ctx.document, endComment),
        true,
      );
      return effect === undefined || endComment.parentElement === null
        ? effect
        : Effect.provideService(effect, CurrentInsertionContext, endComment.parentElement);
    }
    case "attr": {
      const element = node as HTMLElement | SVGElement;
      const setAttr = makeAttributeValueUpdater(
        element,
        getTemplateAttributeNode(element, part.name) ??
          createTemplateAttribute(ctx.document, element, part.name),
      );
      return renderValue(ctx, part.index, (value) =>
        setAttr(isNullish(value) ? undefined : renderToString(value, "")),
      );
    }
    case "boolean-part": {
      const updater = makeBooleanUpdater(node as HTMLElement | SVGElement, part.name);
      return renderValue(ctx, part.index, (value) => updater(!!value));
    }
    case "className-part": {
      const updater = makeClassListUpdater(node as HTMLElement | SVGElement);
      return renderValue(ctx, part.index, (value) => updater(getClassList(value)));
    }
    case "comment-part":
      return renderValue(ctx, part.index, makeTextContentUpdater(node as Comment));
    case "data":
      return setupDataset<E, R>(node as HTMLElement | SVGElement, ctx, part.index);
    case "event":
      return setupEventHandler(node as Element, ctx, part.index, part.name);
    case "property":
      return renderValue(
        ctx,
        part.index,
        setupPropertSetter(node as HTMLElement | SVGElement, part.name),
      );
    case "properties": {
      const element = node as HTMLElement | SVGElement;
      const refs = getSpreadHydrationRefs(ctx.values[part.index]);
      const prehydratedRefs = new Set<RefSubject.HydrationRef<any, any>>();
      const effect = setupProperties<E, R>(element, ctx, part.index, new Set(), prehydratedRefs);
      if (refs.length === 0) return effect;
      return {
        effect,
        hydration: Effect.forEach(
          refs,
          (ref) =>
            Effect.tap(ref(element), () =>
              Effect.sync(() => {
                prehydratedRefs.add(ref);
              }),
            ),
          { discard: true },
        ),
      };
    }
    case "ref":
      return setupRef<R>(node as HTMLElement | SVGElement, ctx, part.index);
    case "sparse-attr": {
      const element = node as HTMLElement | SVGElement;
      const attr =
        getTemplateAttributeNode(element, part.name) ??
        createTemplateAttribute(ctx.document, element, part.name);
      return renderSparseTextContent(
        element,
        part.nodes,
        ++ctx.dynamicIndex,
        ctx,
        makeAttributeValueUpdater(element, attr),
      );
    }
    case "sparse-class-name": {
      const updater = makeClassListUpdater(node as HTMLElement | SVGElement);
      // Sparse segments form one attribute value; a hole may continue a class token.
      return renderSparsePart(
        part.nodes,
        ++ctx.dynamicIndex,
        ctx,
        (segments) => updater(getClassList(segments.join(""))),
        (value) => renderToString(value, " "),
      );
    }
    case "sparse-comment":
      return renderSparseTextContent(node as Comment, part.nodes, ++ctx.dynamicIndex, ctx);
    case "text-part":
      return renderValue(ctx, part.index, makeTextContentUpdater(node as HTMLElement | SVGElement));
    case "sparse-text":
      return renderSparseTextContent(
        node as HTMLElement | SVGElement,
        part.nodes,
        ++ctx.dynamicIndex,
        ctx,
      );
  }
}

function setupHydrationParts<E, R>(
  parts: Template.Template["parts"],
  ctx: TemplateContext<R>,
  where: HydrationNode,
): PartSetup {
  const setup = makePartSetup();
  for (const [part, path] of parts) {
    const effect = setupHydrationPart<E, R>(part, path, ctx, where);
    if (effect !== undefined) {
      addPartEffect(setup, part, effect, ctx);
    }
  }

  return setup;
}

function setupHydrationPart<E, R>(
  part: Template.PartNode | Template.SparsePartNode,
  path: ReadonlyArray<number>,
  ctx: TemplateContext<R>,
  where: HydrationNode,
): Effect.Effect<unknown, E, R> | PropertiesPartEffect | void {
  switch (part._tag) {
    case "node": {
      const hole = findHydrationHole(getChildNodes(where), part.index);
      if (hole === null) throw new CouldNotFindCommentError(part.index);
      return setupHydratedNodePart(part, hole, ctx);
    }
    default:
      return setupRenderPart(part, findHydratePath(where, path), ctx);
  }
}

function renderSparsePart<E, R, T = unknown>(
  parts: Template.SparsePartNode["nodes"],
  index: number,
  ctx: TemplateContext<R>,
  f: (value: ReadonlyArray<string | NoInfer<T>>) => void,
  transformValue: (value: unknown) => T,
): Effect.Effect<unknown, E, R> {
  ctx.expected++;
  let scheduled = false;
  return Fx.tuple(
    ...parts.map((node) => {
      if (node._tag === "text") return Fx.succeed(node.value);
      return Fx.map(liftRenderableToFx(ctx.values[node.index]), transformValue);
    }),
  ).pipe(
    Fx.observe((values) =>
      Effect.tap(
        withCurrentRenderPriority(f, index, ctx, () => f(values)),
        () =>
          Effect.sync(() => {
            scheduled = true;
          }),
      ),
    ),
    Effect.onExit(() =>
      scheduled ? Effect.void : Effect.sync(() => ctx.refCounter.release(index)),
    ),
  );
}

function renderSparseTextContent<E, R>(
  node: Node,
  nodes: Template.SparsePartNode["nodes"],
  index: number,
  ctx: TemplateContext<R>,
  onTextContent: (value: string) => void = makeTextContentUpdater(node),
): Effect.Effect<unknown, E, R> {
  return renderSparsePart(
    nodes,
    index,
    ctx,
    (texts) => onTextContent(texts.join("")),
    (value) => renderToString(value, ""),
  );
}

function renderValue<E, R, X>(
  ctx: TemplateContext,
  index: number,
  f: (value: unknown) => X,
  nodeContext = false,
): void | X | Effect.Effect<unknown, E, R> {
  const value = ctx.values[index];
  // Node Effects describe renderables, as at the root. Fx emissions still require explicit flattening.
  const renderable = nodeContext && Effect.isEffect(value) ? liftNodeEffectResult(value) : value;
  return matchRenderable(renderable, {
    Primitive: f,
    Effect: (effect) => {
      ctx.expected++;
      return effect.pipe(
        Effect.flatMap((value) => withCurrentRenderPriority(f, index, ctx, () => f(value))),
      );
    },
    Fx: (fx) => {
      ctx.expected++;
      let scheduled = false;
      return fx
        .run(
          Sink.make(ctx.onCause, (value) =>
            Effect.tap(
              withCurrentRenderPriority(f, index, ctx, () => f(value)),
              () =>
                Effect.sync(() => {
                  scheduled = true;
                }),
            ),
          ),
        )
        .pipe(
          Effect.onExit(() =>
            scheduled ? Effect.void : Effect.sync(() => ctx.refCounter.release(index)),
          ),
        );
    },
  });
}

// An Effect may return DOM terminals or another renderable description. Preserve borrowed node
// identity while recursively normalizing Effect/array/Option containers; Fx remains unflattened.
function liftNodeEffectResult<E, R>(value: Renderable<unknown, E, R>): Fx.Fx<unknown, E, R> {
  if (Fx.isFx(value)) return value;
  if (Effect.isEffect(value)) {
    return Fx.unwrap(Effect.map(value, liftNodeEffectResult<E, R>));
  }
  if (Array.isArray(value)) return Fx.tuple(...value.map(liftNodeEffectResult<E, R>));
  if (isOption(value)) return isNone(value) ? Fx.null : liftNodeEffectResult<E, R>(value.value);
  if (isObject(value) && "nodeType" in value && typeof value.nodeType === "number") {
    return Fx.succeed(value);
  }
  return liftRenderableToFx<E, R>(value);
}

function matchRenderable<X, A, B, C>(
  renderable: Renderable.Any,
  matches: {
    Primitive: (value: X) => A;
    Effect: (effect: Effect.Effect<X>) => B;
    Fx: (fx: Fx.Fx<X>) => C;
  },
): A | B | C | void {
  if (isNullish(renderable)) return;
  else if (Fx.isFx(renderable)) {
    return matches.Fx(renderable as any);
  } else if (isStream(renderable)) {
    return matches.Fx(Fx.fromStream(renderable));
  } else if (Effect.isEffect(renderable)) {
    return matches.Effect(renderable as any);
  } else if (Array.isArray(renderable)) {
    return matches.Fx(liftRenderableToFx(renderable));
  } else if (isFunction(renderable)) {
    return;
  } else {
    return matches.Primitive(renderable);
  }
}

type SpreadPartDescriptor =
  | {
      readonly id: string;
      readonly kind: "attr" | "boolean" | "event" | "property";
      readonly name: string;
    }
  | { readonly id: string; readonly kind: "class" | "data" | "properties" | "ref" };

type SpreadPartInstance = {
  readonly value: unknown;
  readonly update: (value: unknown) => Effect.Effect<void>;
  readonly dispose: Effect.Effect<void>;
};

const forbiddenSpreadKeys = new Set(["__proto__", "prototype", "constructor"]);
const forbiddenAttributeNameCharacters = new Set(['"', "'", "/", ">", "=", "<"]);
const safeSpreadPropertyNames = new Set([
  "checked",
  "indeterminate",
  "selected",
  "selectedIndex",
  "value",
]);

function getSpreadPartDescriptor(key: string): SpreadPartDescriptor | undefined {
  if (forbiddenSpreadKeys.has(key)) return;
  const [kind, name] = keyToPartType(key);
  switch (kind) {
    case "property":
      return safeSpreadPropertyNames.has(name) ? { id: `${kind}:${name}`, kind, name } : undefined;
    case "attr":
    case "boolean":
      return isValidSpreadAttributeName(name) && !/^on/i.test(name)
        ? { id: `${kind}:${name}`, kind, name }
        : undefined;
    case "event":
      return name.length === 0 ? undefined : { id: `${kind}:${name}`, kind, name };
    case "class":
    case "data":
    case "properties":
    case "ref":
      return { id: kind, kind };
  }
}

function isValidSpreadAttributeName(name: string): boolean {
  if (name.length === 0) return false;
  for (const character of name) {
    const codePoint = character.codePointAt(0)!;
    if (
      codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      forbiddenAttributeNameCharacters.has(character)
    ) {
      return false;
    }
  }
  return true;
}

function getSpreadHydrationRefs(
  value: unknown,
  ancestors: ReadonlySet<object> = new Set(),
): ReadonlyArray<RefSubject.HydrationRef<any, any>> {
  if (!isObject(value) || ancestors.has(value)) return [];
  const nextAncestors = new Set(ancestors).add(value);
  const refs: Array<RefSubject.HydrationRef<any, any>> = [];
  for (const [key, entry] of Object.entries(value)) {
    const descriptor = getSpreadPartDescriptor(key);
    if (descriptor?.kind === "ref" && RefSubject.isHydrationRef(entry)) {
      refs.push(entry);
    } else if (descriptor?.kind === "properties") {
      refs.push(...getSpreadHydrationRefs(entry, nextAncestors));
    }
  }
  return refs;
}

function setupRenderProperties<R>(
  properties: Record<string, unknown>,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext<R>,
  instances: Map<string, SpreadPartInstance>,
  ancestors: ReadonlySet<object>,
  prehydratedRefs: Set<RefSubject.HydrationRef<any, any>>,
): Effect.Effect<void> {
  const desired = new Map<
    string,
    { readonly descriptor: SpreadPartDescriptor; readonly value: unknown }
  >();
  for (const [key, value] of Object.entries(properties)) {
    const descriptor = getSpreadPartDescriptor(key);
    if (descriptor !== undefined) desired.set(descriptor.id, { descriptor, value });
  }

  return Effect.gen(function* () {
    for (const [id, instance] of instances) {
      if (!desired.has(id)) {
        yield* instance.dispose;
        instances.delete(id);
      }
    }

    for (const [id, { descriptor, value }] of desired) {
      const instance = instances.get(id);
      if (instance === undefined) {
        instances.set(
          id,
          yield* makeSpreadPartInstance(
            descriptor,
            value,
            element,
            ctx,
            ancestors,
            prehydratedRefs,
          ),
        );
      } else if (!Object.is(instance.value, value)) {
        yield* instance.update(value);
      }
    }
  });
}

function makeSpreadPartInstance<R>(
  descriptor: SpreadPartDescriptor,
  initialValue: unknown,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext<R>,
  ancestors: ReadonlySet<object>,
  prehydratedRefs: Set<RefSubject.HydrationRef<any, any>>,
): Effect.Effect<SpreadPartInstance> {
  const index = ctx.dynamicIndex++;
  let setup: (partContext: TemplateContext<R>) => Effect.Effect<unknown, unknown, unknown> | void;
  let reset = constVoid;

  switch (descriptor.kind) {
    case "attr": {
      const update = makeAttributeValueUpdater(
        element,
        getTemplateAttributeNode(element, descriptor.name) ??
          createTemplateAttribute(ctx.document, element, descriptor.name),
      );
      setup = (partContext) =>
        renderValue(partContext, index, (value) =>
          update(isNullish(value) ? undefined : renderToString(value, "")),
        );
      reset = () => update(undefined);
      break;
    }
    case "boolean": {
      const update = makeBooleanUpdater(element, descriptor.name);
      setup = (partContext) => renderValue(partContext, index, (value) => update(!!value));
      reset = () => update(false);
      break;
    }
    case "property": {
      const original = Reflect.get(element, descriptor.name);
      const update = setupPropertSetter(element, descriptor.name);
      setup = (partContext) => renderValue(partContext, index, update);
      reset = () => update(original);
      break;
    }
    case "class": {
      const update = makeClassListUpdater(element);
      setup = (partContext) =>
        renderValue(partContext, index, (value) => update(getClassList(value)));
      reset = () => update([]);
      break;
    }
    case "data": {
      const update = makeDatasetUpdater(element);
      setup = (partContext) => setupDataset(element, partContext, index, update);
      reset = () => update(undefined);
      break;
    }
    case "event":
      setup = (partContext) => setupEventHandler(element, partContext, index, descriptor.name);
      break;
    case "properties":
      setup = (partContext) =>
        setupProperties(element, partContext, index, ancestors, prehydratedRefs);
      break;
    case "ref":
      setup = (partContext) => setupRef(element, partContext, index);
      break;
  }

  let value = initialValue;
  let currentScope: Scope.Closeable | undefined;
  const update = (next: unknown) =>
    Effect.gen(function* () {
      if (currentScope !== undefined) yield* Scope.close(currentScope, Exit.void);

      const scope = yield* Scope.fork(ctx.eventScope);
      currentScope = scope;
      const disposables = new Set<Disposable>();
      const refCounter = yield* makeRefCounter;
      yield* Scope.addFinalizer(
        scope,
        Effect.sync(() => disposables.forEach(dispose)),
      );
      const partContext: TemplateContext<R> = {
        ...ctx,
        disposables,
        disposeEventHandlers: true,
        eventScope: scope,
        refCounter,
        scope,
        services: Context.add(ctx.services, Scope.Scope, scope),
        values: makeArrayLike(index, next),
        expected: 0,
      };
      const prehydrated =
        descriptor.kind === "ref" &&
        RefSubject.isHydrationRef(next) &&
        prehydratedRefs.delete(next);
      const effect = prehydrated ? undefined : setup(partContext);
      if (Effect.isEffect(effect)) {
        yield* Effect.forkIn(
          Effect.provideService(
            Effect.catchCause(effect, partContext.onCause),
            Scope.Scope,
            scope,
          ) as Effect.Effect<unknown>,
          scope,
        );
        if (partContext.expected > 0 && refCounter.expect(partContext.expected)) {
          yield* refCounter.wait;
        } else {
          yield* Effect.yieldNow;
        }
      }
      value = next;
    });

  return Effect.as(update(initialValue), {
    get value() {
      return value;
    },
    update,
    dispose: Effect.suspend(() =>
      (currentScope === undefined ? Effect.void : Scope.close(currentScope, Exit.void)).pipe(
        Effect.andThen(Effect.sync(reset)),
      ),
    ),
  } satisfies SpreadPartInstance);
}

/**
 * Advanced per-template DOM rendering state used by renderer extensions.
 *
 * @remarks
 * ## Why
 *
 * The context gathers explicit Effect services, a forked child Scope, delegated
 * native events, queue policy, ref coordination, and optional hydration state
 * without relying on a hidden component tree.
 *
 * ## Ownership and lifetime
 *
 * The child `scope` owns one-shot render setup. The surrounding `eventScope`
 * owns mounted dynamic parts, handler fibers, queued callbacks, and ref
 * finalizers until the rendered range is unmounted. Replaceable parts create
 * their own child event Scope so replacement disposes only that part.
 *
 * @example
 * ```ts
 * import type { TemplateContext } from "@typed/template/Render"
 *
 * declare const context: TemplateContext
 * context.renderQueue
 * ```
 *
 * @since 1.0.0
 * @category Template run context
 */
export type TemplateContext<R = never> = {
  readonly document: Document;
  readonly renderQueue: RQ.RenderQueue;
  readonly disposables: Set<Disposable>;
  readonly eventSource: EventSource;
  readonly refCounter: IndexRefCounter;
  readonly scope: Scope.Closeable;
  readonly eventScope: Scope.Scope;
  readonly disposeEventHandlers: boolean;
  readonly values: ArrayLike<Renderable<unknown, any, any>>;
  readonly services: Context.Context<R | Scope.Scope>;
  readonly onCause: (cause: Cause.Cause<any>) => Effect.Effect<unknown>;

  /**
   * @internal
   */
  expected: number;
  /**
   * @internal
   */
  dynamicIndex: number;

  readonly hydrateContext: HydrateContext | undefined;
};

const makeTemplateContext = Effect.fn(function* <
  Values extends ArrayLike<Renderable.Any>,
  RSink = never,
>(
  document: Document,
  values: Values,
  onCause: (
    cause: Cause.Cause<Renderable.Error<Values[number]>>,
  ) => Effect.Effect<unknown, never, RSink>,
) {
  const renderQueue: RQ.RenderQueue = yield* CurrentRenderQueue;
  const services: Context.Context<Renderable.Services<Values[number]> | RSink | Scope.Scope> =
    yield* Effect.context<Renderable.Services<Values[number]> | RSink | Scope.Scope>();
  const refCounter: IndexRefCounter = yield* makeRefCounter;
  const eventScope = Context.get(services, Scope.Scope);
  const scope: Scope.Closeable = yield* Scope.fork(eventScope);
  const eventSource: EventSource = makeEventSource();
  const servicesWithScope = Context.add(services, Scope.Scope, scope);
  const hydrateContext = Context.getOption(services, HydrateContext);
  const ctx: TemplateContext<Renderable.Services<Values[number]> | RSink | Scope.Scope> = {
    services: Context.add(services, Scope.Scope, scope),
    document,
    renderQueue,
    disposables: new Set(),
    eventSource,
    refCounter,
    scope,
    eventScope,
    disposeEventHandlers: false,
    values,
    onCause: (cause) =>
      Cause.hasInterruptsOnly(cause)
        ? Effect.void
        : Effect.provideContext(onCause(cause), servicesWithScope),
    expected: 0,
    dynamicIndex: values.length,
    // Completion belongs to this template instance; sibling consumers share only the parsed ranges.
    hydrateContext: isNone(hydrateContext) ? undefined : { ...hydrateContext.value },
  };

  yield* Scope.addFinalizer(
    scope,
    Effect.sync(() => ctx.disposables.forEach(dispose)),
  );

  return ctx;
});

/**
 * Converts any Renderable into an Fx while preserving its nested errors and
 * service requirements.
 *
 * @remarks
 * ## Why
 *
 * Effect, Stream, Fx, Option, arrays, object structures, primitives, and
 * existing RenderEvents all enter rendering through one push-based substrate.
 * This is the compositional bridge that keeps Effect v4 foundational rather
 * than replacing it with a component-specific runtime.
 *
 * ## Ownership and lifetime
 *
 * Lifting is lazy. The Scope running the returned Fx owns upstream acquisition,
 * interruption, and finalizers; existing DOM/HTML events retain their producer's
 * ownership contract.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { liftRenderableToFx } from "@typed/template/Render"
 *
 * const output = liftRenderableToFx(Effect.succeed("ready"))
 * ```
 *
 * @see https://effect.website/docs/stream/introduction/
 *
 * @since 1.0.0
 * @category Renderable normalization
 */
export function liftRenderableToFx<const T extends Renderable.Any>(
  renderable: T,
): Fx.Fx<Renderable.Success<T>, Renderable.Error<T>, Renderable.Services<T>>;
export function liftRenderableToFx<E = never, R = never>(
  renderable: Renderable<unknown, E, R>,
): Fx.Fx<any, E, R>;
export function liftRenderableToFx<E = never, R = never>(
  renderable: Renderable<unknown, E, R>,
): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "function":
      return Fx.isFx(renderable) ? renderable : Fx.null;
    case "undefined":
    case "object": {
      if (isNullish(renderable)) {
        return Fx.null;
      } else if (isMany(renderable)) {
        return renderHtml`${renderable}` as Fx.Fx<any, E, R>;
      } else if (Array.isArray(renderable)) {
        return Fx.tuple(...renderable.map(liftRenderableToFx<E, R>));
      } else if (isOption(renderable)) {
        return isNone(renderable) ? Fx.null : liftRenderableToFx((renderable as Some<any>).value);
      } else if (Fx.isFx(renderable)) {
        return renderable;
      } else if (isStream(renderable)) {
        return Fx.fromStream(renderable as Stream<unknown, E, R>);
      } else if (Effect.isEffect(renderable)) {
        return Fx.unwrap(Effect.map(renderable, liftRenderableToFx<E, R>));
      } else if (isRenderEvent(renderable)) {
        return Fx.succeed(renderable);
      } else {
        return Fx.struct(mapRecord(renderable, liftRenderableToFx));
      }
    }
    default:
      return Fx.succeed(renderable);
  }
}

function addDisposable(ctx: TemplateContext, disposable: Disposable) {
  ctx.disposables.add(disposable);
  return () => ctx.disposables.delete(disposable);
}

function dispose(disposable: Disposable) {
  disposable[Symbol.dispose]();
}

function makeArrayLike<A>(index: number, value: A): ArrayLike<A> {
  return {
    length: index + 1,
    [index]: value,
  };
}

/**
 * Locates a compatible SSR template range for an advanced render context.
 *
 * @remarks
 * ## Why
 *
 * Hydration is a precise marker-and-hash match, not a promise to reconcile any
 * arbitrary existing HTML. A missing compatible range disables hydration for
 * the context and lets normal DOM construction proceed.
 *
 * ## Ownership and lifetime
 *
 * The returned range and context are borrowed from the active render Scope.
 * This function does not acquire nodes, attach events, or sanitize markup.
 *
 * @example
 * ```ts
 * import { attemptHydration } from "@typed/template/Render"
 * import type { TemplateContext } from "@typed/template/Render"
 *
 * declare const context: TemplateContext
 * const match = attemptHydration(context, "template-hash")
 * ```
 *
 * @since 1.0.0
 * @category DOM adoption
 */
export function attemptHydration(
  ctx: TemplateContext,
  hash: string,
): { readonly where: HydrationTemplate; readonly hydrateCtx: HydrateContext } | undefined {
  if (ctx.hydrateContext && ctx.hydrateContext.hydrate) {
    const where = findHydrationTemplateByHash(ctx.hydrateContext, hash);
    if (where === null) {
      ctx.hydrateContext.hydrate = false;
      return;
    } else {
      // Reserve before asynchronous setup so concurrent equal-hash siblings cannot adopt this range.
      where.claimed = true;
      return { where, hydrateCtx: ctx.hydrateContext };
    }
  }
}

function getTemplateAttributeNode(element: Element, name: string): Attr | null {
  const attribute = getAttributeDescriptor(element.namespaceURI, name);
  return element.getAttributeNodeNS(attribute.namespace, attribute.localName);
}

function createTemplateAttribute(document: Document, element: Element, name: string): Attr {
  const attribute = getAttributeDescriptor(element.namespaceURI, name);
  if (attribute.namespace === null && element.namespaceURI === HTML_NAMESPACE) {
    return document.createAttribute(attribute.qualifiedName);
  }
  return document.createAttributeNS(attribute.namespace, attribute.qualifiedName);
}

function setupEventHandler(element: Element, ctx: TemplateContext, index: number, name: string) {
  const value = ctx.values[index];
  if (isNullish(value)) return;
  const disposable = ctx.eventSource.addEventListener(
    element,
    name,
    EventHandler.fromEffectOrEventHandler(
      value as
        | Effect.Effect<unknown, never, never>
        | EventHandler.EventHandler<Event, never, never>,
    ).pipe(EventHandler.provide(ctx.services), EventHandler.catchCause(ctx.onCause)),
  );
  if (ctx.disposeEventHandlers) ctx.disposables.add(disposable);
}

function setupDataset<E, R>(
  element: HTMLElement | SVGElement,
  ctx: TemplateContext<R>,
  index: number,
  update = makeDatasetUpdater(element),
): Effect.Effect<unknown, E, R> | void {
  const value = ctx.values[index];
  if (isNullish(value)) return;
  ctx.expected++;
  let scheduled = false;
  return liftRenderableToFx(value)
    .run(
      Sink.make(ctx.onCause, (data) =>
        Effect.tap(
          withCurrentRenderPriority(update, index, ctx, () => update(data)),
          () =>
            Effect.sync(() => {
              scheduled = true;
            }),
        ),
      ),
    )
    .pipe(
      Effect.onExit(() =>
        scheduled ? Effect.void : Effect.sync(() => ctx.refCounter.release(index)),
      ),
    );
}

function setupProperties<E, R>(
  element: HTMLElement | SVGElement,
  ctx: TemplateContext<R>,
  index: number,
  ancestors: ReadonlySet<object> = new Set(),
  prehydratedRefs: Set<RefSubject.HydrationRef<any, any>> = new Set(),
): Effect.Effect<never, E, R> {
  const instances = new Map<string, SpreadPartInstance>();
  const reconcile = (props: unknown) => {
    if (!isObject(props) || ancestors.has(props)) {
      return setupRenderProperties<R>({}, element, ctx, instances, ancestors, prehydratedRefs);
    }
    const nextAncestors = new Set(ancestors).add(props);
    return setupRenderProperties<R>(
      props as Record<string, unknown>,
      element,
      ctx,
      instances,
      nextAncestors,
      prehydratedRefs,
    );
  };
  const release = () => ctx.refCounter.release(index);
  const value = ctx.values[index];
  ctx.expected++;

  let emitted = false;
  const onValue = (props: unknown) =>
    Effect.tap(reconcile(props), () =>
      Effect.sync(() => {
        emitted = true;
        release();
      }),
    );

  let setup: Effect.Effect<unknown, E, R>;
  if (Fx.isFx(value)) {
    setup = value.run(Sink.make(ctx.onCause, onValue));
  } else if (isStream(value)) {
    setup = Fx.fromStream(value as Stream<unknown, E, R>).run(Sink.make(ctx.onCause, onValue));
  } else if (Effect.isEffect(value)) {
    setup = Effect.flatMap(value as Effect.Effect<unknown, E, R>, onValue);
  } else {
    setup = onValue(value);
  }

  const cleanup = Effect.suspend(() =>
    Effect.forEach(instances.values(), (instance) => instance.dispose, {
      discard: true,
    }).pipe(Effect.andThen(Effect.sync(() => instances.clear()))),
  );

  return setup.pipe(
    Effect.onExit(() => (emitted ? Effect.void : Effect.sync(release))),
    Effect.andThen(Effect.never),
    Effect.ensuring(cleanup),
  );
}

function setupRef<R>(element: HTMLElement | SVGElement, ctx: TemplateContext<R>, index: number) {
  const renderable = ctx.values[index];
  if (isNullish(renderable)) return;
  if (isFunction(renderable)) {
    return matchRenderable((renderable as Function)(element), {
      Primitive: constVoid,
      Effect: identity,
      Fx: Fx.drain,
    });
  }
  throw new Error("Invalid value provided to ref part");
}

function setupPropertSetter(element: Element, name: string) {
  return (value: unknown) => {
    (element as any)[name] = value;
  };
}

function setupHydratedNodePart<E, R>(
  part: Template.NodePart,
  hole: HydrationHole,
  ctx: TemplateContext<R>,
): Effect.Effect<unknown, E, R> | void {
  const nestedCtx: HydrateContext = { where: hole, hydrate: true };
  const renderable = ctx.values[part.index];
  if (isMany(renderable)) {
    const effect = renderManyToDom(
      renderable,
      hole.endComment,
      part.index,
      ctx,
      nestedCtx,
    ) as Effect.Effect<unknown, E, R>;
    return hole.endComment.parentElement === null
      ? effect
      : Effect.provideService(effect, CurrentInsertionContext, hole.endComment.parentElement);
  }

  const effect = renderValue<E, R, void>(
    ctx,
    part.index,
    makeHydratedNodeUpdater(ctx.document, hole),
    true,
  );
  if (effect === undefined) return;
  const hydrated = Effect.provideService(effect, HydrateContext, nestedCtx);
  return hole.endComment.parentElement === null
    ? hydrated
    : Effect.provideService(hydrated, CurrentInsertionContext, hole.endComment.parentElement);
}

function makeHydratedNodeUpdater(document: Document, hole: HydrationHole) {
  let isHydrating = true;
  let update: ((value: unknown) => void) | undefined;
  return (value: unknown) => {
    if (isHydrating) {
      isHydrating = false;
      return;
    }
    if (update === undefined) {
      const nodes = getAllSiblingsBetween(hole.startComment, hole.endComment);
      const text = nodes.length === 1 && isText(nodes[0]) ? nodes[0] : null;
      update = makeNodeUpdater(document, hole.endComment, text, nodes);
    }
    update(value);
  };
}
