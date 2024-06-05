import * as Context from "@typed/context"
import * as Fx from "@typed/fx"
import type { Rendered } from "@typed/wire"
import { persistent } from "@typed/wire"
import type * as Cause from "effect/Cause"
import type { Chunk } from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import { flow } from "effect/Function"
import * as Scope from "effect/Scope"
import { type Directive, isDirective } from "../../Directive.js"
import * as ElementRef from "../../ElementRef.js"
import * as ElementSource from "../../ElementSource.js"
import * as EventHandler from "../../EventHandler.js"
import type { Placeholder } from "../../Placeholder.js"
import type { ToRendered } from "../../Render.js"
import type { Renderable } from "../../Renderable.js"
import type { RenderContext } from "../../RenderContext.js"
import { DomRenderEvent, type RenderEvent } from "../../RenderEvent.js"
import { DEFAULT_PRIORITY, RenderQueue } from "../../RenderQueue.js"
import type { RenderTemplate } from "../../RenderTemplate.js"
import type * as Template from "../../Template.js"
import type { EventSource } from "../EventSource.js"
import { makeEventSource } from "../EventSource.js"
import type { IndexRefCounter } from "../indexRefCounter.js"
import { makeRefCounter } from "../indexRefCounter.js"
import type { ParentChildNodes } from "../utils.js"
import { findHoleComment, findPath, keyToPartType } from "../utils.js"
import { isNullOrUndefined } from "./helpers.js"
import { EventPartImpl, RefPartImpl, syncPartToPart } from "./parts.js"
import { getBrowserEntry } from "./render-entry.js"
import * as SyncPartsInternal from "./render-sync-parts.js"
import type { SyncPart } from "./SyncPart.js"

export type TemplateContext = {
  /**
   * @internal
   */
  expected: number
  /**
   * @internal
   */
  spreadIndex: number

  readonly context: Context.Context<Scope.Scope>
  readonly document: Document
  readonly eventSource: EventSource
  readonly parentScope: Scope.Scope
  readonly queue: RenderQueue
  readonly refCounter: IndexRefCounter
  readonly renderContext: RenderContext
  readonly scope: Scope.CloseableScope
  readonly values: ReadonlyArray<Renderable<any, any>>
  readonly onCause: (cause: Cause.Cause<any>) => Effect.Effect<unknown>
}

export const renderTemplate: (
  document: Document,
  renderContext: RenderContext
) => RenderTemplate = (document, renderContext) =>
<Values extends ReadonlyArray<Renderable<any, any>>>(
  templateStrings: TemplateStringsArray,
  values: Values
) => {
  const entry = getBrowserEntry(document, renderContext, templateStrings)
  if (entry.template.parts.length === 0) {
    return Fx.succeed(DomRenderEvent(persistent(document, document.importNode(entry.content, true))))
  }

  return Fx.make<
    RenderEvent,
    Placeholder.Error<Values[number]>,
    Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>
  >((sink) =>
    Effect.catchAllCause(
      Effect.gen(function*() {
        // Create a context for rendering our template
        const ctx = yield* makeTemplateContext<Values>(
          document,
          renderContext,
          values,
          sink.onFailure
        )
        const content = document.importNode(entry.content, true)

        // Setup all parts
        const effects = setupParts(entry.template.parts, content, ctx)
        if (effects.length > 0) {
          yield* Effect.forEach(effects, flow(Effect.catchAllCause(ctx.onCause), Effect.forkIn(ctx.scope)))
        }

        // If there's anything to wait on and it's not already done, wait for an initial value
        // for all asynchronous sources.
        if (ctx.expected > 0 && (yield* ctx.refCounter.expect(ctx.expected))) {
          yield* ctx.refCounter.wait
        }

        // Create a persistent wire from our content
        const wire = persistent(document, content)

        // Setup our event listeners for our wire.
        // We use the parentScope to allow event listeners to exist
        // beyond the lifetime of the current Fiber, but no further than its parent template.
        yield* ctx.eventSource.setup(wire, ctx.parentScope)

        // Emit our DomRenderEvent
        yield* sink.onSuccess(DomRenderEvent(wire)).pipe(
          // Ensure our templates last forever in the DOM environment
          // so event listeners are kept attached to the current Scope.
          Effect.zipRight(Effect.never),
          // Close our scope whenever the current Fiber is interrupted
          Effect.onExit((exit) => Scope.close(ctx.scope, exit))
        )
      }),
      sink.onFailure
    )
  )
}

export function makeTemplateContext<Values extends ReadonlyArray<Renderable<any, any>>>(
  document: Document,
  renderContext: RenderContext,
  values: ReadonlyArray<Renderable<any, any>>,
  onCause: (cause: Cause.Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<unknown>
): Effect.Effect<TemplateContext, never, Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>> {
  return Effect.gen(function*() {
    const refCounter = yield* makeRefCounter
    const context = yield* Effect.context<Placeholder.Context<Values[number]> | Scope.Scope | RenderQueue>()
    const queue = Context.get(context, RenderQueue)
    const parentScope = Context.get(context, Scope.Scope)
    const eventSource = makeEventSource()
    const scope = yield* Scope.fork(parentScope, ExecutionStrategy.sequential)
    const templateContext: TemplateContext = {
      context: Context.add(context, Scope.Scope, scope),
      expected: 0,
      document,
      eventSource,
      parentScope,
      queue,
      refCounter,
      renderContext,
      scope,
      values,
      spreadIndex: values.length,
      onCause
    }

    return templateContext
  })
}

function setupParts(
  parts: Template.Template["parts"],
  content: ParentChildNodes,
  ctx: TemplateContext
) {
  const effects: Array<Effect.Effect<void, any, any>> = []

  for (const [part, path] of parts) {
    const effect = setupPart(part, content, path, ctx)
    if (effect) {
      effects.push(effect)
    }
  }

  return effects
}

function setupPart(
  part: Template.PartNode | Template.SparsePartNode,
  content: ParentChildNodes,
  path: Chunk<number>,
  ctx: TemplateContext
) {
  switch (part._tag) {
    case "attr":
      return setupAttrPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx, ctx.values[part.index])
    case "boolean-part":
      return setupBooleanPart(
        part,
        findPath(content, path) as HTMLElement | SVGElement,
        ctx,
        ctx.values[part.index]
      )
    case "className-part":
      return setupClassNamePart(
        part,
        findPath(content, path) as HTMLElement | SVGElement,
        ctx,
        ctx.values[part.index]
      )
    case "comment-part":
      return setupCommentPart(part, findPath(content, path) as Comment, ctx)
    case "data":
      return setupDataPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx, ctx.values[part.index])
    case "event":
      return setupEventPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx, ctx.values[part.index])
    case "node": {
      const parent = findPath(content, path) as Element
      const comment = findHoleComment(parent, part.index)
      return setupNodePart(part, comment, ctx, null, [])
    }
    case "properties":
      return setupPropertiesPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx)
    case "property":
      return setupPropertyPart(
        part,
        findPath(content, path) as HTMLElement | SVGElement,
        ctx,
        ctx.values[part.index]
      )
    case "ref":
      return setupRefPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx)
    case "sparse-attr":
      return setupSparseAttrPart(part, findPath(content, path) as HTMLElement | SVGElement, ctx)
    case "sparse-class-name":
      return setupSparseClassNamePart(part, findPath(content, path) as HTMLElement | SVGElement, ctx)
    case "sparse-comment":
      return setupSparseCommentPart(part, findPath(content, path) as Comment, ctx)
    case "text-part": {
      const parent = findPath(content, path) as Element
      const comment = findHoleComment(parent, part.index)
      return setupTextPart(part, comment, ctx)
    }
  }
}

export function setupAttrPart(
  { index, name }: Pick<Template.AttrPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const attr = element.getAttributeNode(name) ?? ctx.document.createAttribute(name)
  const part = SyncPartsInternal.makeAttributePart(index, element, attr)
  return matchSyncPart(renderable, ctx, part)
}

export function setupBooleanPart(
  { index, name }: Pick<Template.BooleanPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const part = SyncPartsInternal.makeBooleanAttributePart(name, index, element)
  return matchSyncPart(renderable, ctx, part)
}

export function setupClassNamePart(
  { index }: Pick<Template.ClassNamePartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const part = SyncPartsInternal.makeClassNamePart(index, element)
  return matchSyncPart(renderable, ctx, part)
}

export function setupCommentPart(
  { index }: Pick<Template.CommentPartNode, "index">,
  comment: Comment,
  ctx: TemplateContext
) {
  const part = SyncPartsInternal.makeCommentPart(index, comment)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

export function setupDataPart(
  { index }: Pick<Template.DataPartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const part = SyncPartsInternal.makeDataPart(index, element)
  return matchSyncPart(renderable, ctx, part)
}

export function setupEventPart(
  { index, name }: Pick<Template.EventPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  if (isNullOrUndefined(renderable)) return null

  if (isDirective(renderable)) {
    return renderable(
      new EventPartImpl(
        name,
        index,
        ElementSource.fromElement(element),
        ctx.onCause,
        (handler) => ctx.eventSource.addEventListener(element, name, handler)
      )
    )
  } else {
    const handler = getEventHandler(renderable, ctx.context, ctx.onCause)
    if (handler === null) return null
    ctx.eventSource.addEventListener(element, name, handler)
    return null
  }
}

export function getEventHandler<E, R>(
  renderable: any,
  ctx: Context.Context<any> | Context.Context<never>,
  onCause: (cause: Cause.Cause<E>) => Effect.Effect<unknown>
): EventHandler.EventHandler<never, never> | null {
  if (renderable && typeof renderable === "object") {
    if (EventHandler.EventHandlerTypeId in renderable) {
      return EventHandler.make(
        (ev) =>
          Effect.provide(
            Effect.catchAllCause((renderable as EventHandler.EventHandler<Event, E, R>).handler(ev), onCause),
            ctx as any
          ),
        (renderable as EventHandler.EventHandler<Event, E, R>).options
      )
    } else if (Effect.EffectTypeId in renderable) {
      return EventHandler.make(() => Effect.provide(Effect.catchAllCause(renderable, onCause), ctx))
    }
  }

  return null
}

export function setupNodePart(
  { index }: Template.NodePart,
  comment: Comment,
  ctx: TemplateContext,
  text: Text | null,
  nodes: Array<Node>
) {
  const part = SyncPartsInternal.makeNodePart(index, comment, ctx.document, text, nodes)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

export function setupPropertyPart(
  { index, name }: Pick<Template.PropertyPartNode, "index" | "name">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const part = SyncPartsInternal.makePropertyPart(name, index, element)
  return matchSyncPart(renderable, ctx, part)
}

export function setupRefPart(
  { index }: Pick<Template.RefPartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext
) {
  const renderable = ctx.values[index]

  if (isNullOrUndefined(renderable)) return null
  else if (isDirective(renderable)) {
    return renderable(
      new RefPartImpl(ElementSource.fromElement(element), index)
    )
  } else if (ElementRef.isElementRef(renderable)) {
    // TODO: We need to enable only setting these values once the Template has been rendered into the DOM
    return ElementRef.set(renderable, element)
  } else {
    return null
  }
}

export function setupPropertiesPart(
  { index }: Pick<Template.PropertiesPartNode, "index">,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext
) {
  const renderable = ctx.values[index]
  if (renderable && typeof renderable === "object") {
    const effects: Array<Effect.Effect<void, any, any>> = []
    const addEffect = (effect: Effect.Effect<void, any, any> | null | undefined) => {
      if (isNullOrUndefined(effect)) return
      effects.push(effect)
    }

    for (const [key, value] of Object.entries(renderable as Record<string, any>)) {
      const [type, name] = keyToPartType(key)
      const index = ++ctx.spreadIndex
      switch (type) {
        case "attr":
          addEffect(setupAttrPart({ index, name }, element, ctx, value))
          break
        case "boolean":
          addEffect(setupBooleanPart({ index, name }, element, ctx, value))
          break
        case "class":
          addEffect(setupClassNamePart({ index }, element, ctx, value))
          break
        case "data":
          addEffect(setupDataPart({ index }, element, ctx, value))
          break
        case "event":
          addEffect(setupEventPart({ index, name }, element, ctx, value))
          break
        case "property":
          addEffect(setupPropertyPart({ index, name }, element, ctx, value))
          break
      }
    }

    return Effect.all(effects, { concurrency: "unbounded" })
  }

  return null
}

export function setupSparseAttrPart(
  { name, nodes }: Template.SparseAttrNode,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext
) {
  ctx.expected++
  const attr = element.getAttributeNode(name) ?? ctx.document.createAttribute(name)
  const index = nodes.find((n): n is Template.AttrPartNode => n._tag === "attr")!.index
  return SyncPartsInternal.handleSparseAttribute(
    element,
    attr,
    nodes,
    ctx.values,
    (f) => Effect.zipRight(ctx.queue.add(attr, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

export function setupSparseClassNamePart(
  { nodes }: Template.SparseClassNameNode,
  element: HTMLElement | SVGElement,
  ctx: TemplateContext
) {
  ctx.expected++
  const index = nodes.find((n): n is Template.ClassNamePartNode => n._tag === "className-part")!.index
  return SyncPartsInternal.handleSparseClassName(
    element,
    nodes,
    ctx.values,
    (f) => Effect.zipRight(ctx.queue.add(element.classList, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

export function setupSparseCommentPart(
  { nodes }: Template.SparseCommentNode,
  comment: Comment,
  ctx: TemplateContext
) {
  ctx.expected++
  const index = nodes.find((n): n is Template.CommentPartNode => n._tag === "comment-part")!.index
  return SyncPartsInternal.handleSparseComment(
    comment,
    nodes,
    ctx.values,
    (f) => Effect.zipRight(ctx.queue.add(comment, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

export function setupTextPart({ index }: Template.TextPartNode, comment: Comment, ctx: TemplateContext) {
  const text = comment.previousSibling
    ? SyncPartsInternal.getPreviousTextSibling(comment.previousSibling) ?? createText(ctx.document, comment)
    : createText(ctx.document, comment)
  const part = SyncPartsInternal.makeTextPart(index, text)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

function createText(document: Document, comment: Comment) {
  const text = document.createTextNode("")
  comment.parentNode!.insertBefore(text, comment)
  return text
}

export function matchSyncPart(
  renderable: Renderable<any, any>,
  ctx: TemplateContext,
  syncPart: SyncPart
) {
  return matchRenderable(renderable, ctx, {
    Fx: (fx) =>
      fx.run(Fx.Sink.make(
        ctx.onCause,
        (value) => runSyncUpdate(syncPart, value, ctx)
      )),
    Effect: (effect) => Effect.flatMap(effect, (value) => runSyncUpdate(syncPart, value, ctx)),
    Directive: (directive) => directive(syncPartToPart(syncPart, ({ value }) => runSyncUpdate(syncPart, value, ctx))),
    Otherwise: (value) => {
      syncPart.update(value as never)
      return null
    }
  })
}

function unwrapRenderable<E, R>(renderable: unknown): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return Fx.succeed(null)
      else if (Array.isArray(renderable)) {
        return renderable.length === 0
          ? Fx.succeed(null)
          // TODO: We need to ensure the ordering of these values in server environments
          : Fx.map(Fx.tuple(renderable.map(unwrapRenderable)), (xs) => xs.flat()) as any
      } else if (Fx.FxTypeId in renderable) {
        return renderable as any
      } else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(Effect.map(renderable as any, unwrapRenderable<E, R>))
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}

export function runSyncUpdate(
  syncPart: SyncPart,
  value: any,
  ctx: TemplateContext
) {
  return Effect.zipRight(
    ctx.queue.add(syncPart, () => syncPart.update(value as never), DEFAULT_PRIORITY),
    ctx.refCounter.release(syncPart.index)
  )
}

export function matchRenderable(
  renderable: Renderable<any, any>,
  ctx: TemplateContext,
  matches: {
    Fx: (fx: Fx.Fx<any, any, any>) => Effect.Effect<void, any, any>
    Effect: (effect: Effect.Effect<any, any, any>) => Effect.Effect<void, any, any>
    Directive: (directive: Directive<any, any>) => Effect.Effect<void, any, any>
    Otherwise: (_: any) => Effect.Effect<void, any, any> | null
  }
): Effect.Effect<void, any, any> | null {
  if (Fx.isFx(renderable)) {
    ctx.expected++
    return matches.Fx(renderable)
  } else if (Effect.isEffect(renderable)) {
    ctx.expected++
    return matches.Effect(renderable)
  } else if (isDirective<any, any>(renderable)) {
    ctx.expected++
    return matches.Directive(renderable)
  } else if (Array.isArray(renderable)) {
    return matches.Fx(unwrapRenderable(renderable))
  } else {
    return matches.Otherwise(renderable)
  }
}

export function attachRoot<T extends RenderEvent | null>(
  cache: RenderContext["renderCache"],
  where: HTMLElement,
  what: RenderEvent | null // TODO: Should we support HTML RenderEvents here too?,
): Effect.Effect<ToRendered<T>> {
  return Effect.sync(() => {
    const wire = what?.valueOf() as ToRendered<T>
    const previous = cache.get(where)

    if (wire !== previous) {
      if (previous && !wire) removeChildren(where, previous)

      cache.set(where, wire || null)

      if (wire) replaceChildren(where, wire)

      return wire as ToRendered<T>
    }

    return previous as ToRendered<T>
  })
}

export function removeChildren(where: HTMLElement, previous: Rendered) {
  for (const node of getNodes(previous)) {
    where.removeChild(node)
  }
}

export function replaceChildren(where: HTMLElement, wire: Rendered) {
  where.replaceChildren(...getNodes(wire))
}

export function getNodes(rendered: Rendered): Array<globalThis.Node> {
  const value = rendered.valueOf() as globalThis.Node | Array<globalThis.Node>
  return Array.isArray(value) ? value : [value]
}
