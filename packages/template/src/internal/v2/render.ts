import * as Context from "@typed/Context"
import * as Fx from "@typed/fx"
import { persistent } from "@typed/wire"
import type { Cause } from "effect"
import { Effect, ExecutionStrategy, flow, Scope } from "effect"
import type { Chunk } from "effect/Chunk"
import { type Directive, isDirective } from "../../Directive.js"
import * as ElementRef from "../../ElementRef.js"
import * as ElementSource from "../../ElementSource.js"
import * as EventHandler from "../../EventHandler.js"
import type { Placeholder } from "../../Placeholder.js"
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
import { findPath, keyToPartType } from "../utils.js"
import { isNullOrUndefined } from "./helpers.js"
import { EventPartImpl, RefPartImpl, syncPartToPart } from "./parts.js"
import { getRenderEntry } from "./render-entry.js"
import * as SyncPartsInternal from "./render-sync-parts.js"
import type { SyncPart } from "./SyncPart.js"

type TemplateContext = {
  /**
   * @internal
   */
  expected: number
  /**
   * @internal
   */
  templateIndex: number

  readonly content: DocumentFragment
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
  const entry = getRenderEntry(document, renderContext, templateStrings)
  if (entry.template.parts.length === 0) {
    return Fx.succeed(DomRenderEvent(persistent(document, document.importNode(entry.content, true))))
  }

  return Fx.make<
    RenderEvent,
    Placeholder.Error<Values[number]>,
    Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>
  >((sink) =>
    Effect.catchAllCause(
      Effect.gen(function*(_) {
        // Create a context for rendering our template
        const ctx = yield* _(
          makeTemplateContext<Values>(
            entry.content,
            document,
            renderContext,
            values,
            sink.onFailure
          )
        )

        // Setup all parts
        const effects = setupParts(entry.template.parts, ctx)
        if (effects.length > 0) {
          yield* _(Effect.forEach(effects, flow(Effect.catchAllCause(ctx.onCause), Effect.forkIn(ctx.scope))))
        }

        // If there's anything to wait on and it's not already done, wait for an initial value
        // for all asynchronous sources.
        if (ctx.expected > 0 && (yield* _(ctx.refCounter.expect(ctx.expected)))) {
          yield* _(ctx.refCounter.wait)
        }

        // Create a persistent wire from our content
        const wire = persistent(document, ctx.content)

        // Setup our event listeners for our wire.
        // We use the parentScope to allow event listeners to exist
        // beyond the lifetime of the current Fiber, but no further than its parent template.
        yield* _(ctx.eventSource.setup(wire, ctx.parentScope))

        yield* _(
          // Emit our DomRenderEvent
          sink.onSuccess(DomRenderEvent(wire)),
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

function makeTemplateContext<Values extends ReadonlyArray<Renderable<any, any>>>(
  entry: DocumentFragment,
  document: Document,
  renderContext: RenderContext,
  values: ReadonlyArray<Renderable<any, any>>,
  onCause: (cause: Cause.Cause<Placeholder.Error<Values[number]>>) => Effect.Effect<unknown>
): Effect.Effect<TemplateContext, never, Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>> {
  return Effect.gen(function*(_) {
    const refCounter = yield* _(makeRefCounter)
    const context = yield* _(Effect.context<Placeholder.Context<Values[number]> | Scope.Scope | RenderQueue>())
    const queue = Context.get(context, RenderQueue)
    const parentScope = Context.get(context, Scope.Scope)
    const eventSource = makeEventSource()
    const content = document.importNode(entry, true)
    const scope = yield* _(Scope.fork(parentScope, ExecutionStrategy.sequential))
    const renderPartContext: TemplateContext = {
      context: Context.add(context, Scope.Scope, scope),
      expected: 0,
      content,
      document,
      eventSource,
      parentScope,
      queue,
      refCounter,
      renderContext,
      scope,
      values,
      templateIndex: values.length,
      onCause
    }

    return renderPartContext
  })
}

function setupParts(parts: Template.Template["parts"], ctx: TemplateContext) {
  const effects: Array<Effect.Effect<void, any, any>> = []

  for (const [part, path] of parts) {
    const effect = setupPart(part, path, ctx)
    if (effect) {
      effects.push(effect)
    }
  }

  return effects
}

function setupPart(part: Template.PartNode | Template.SparsePartNode, path: Chunk<number>, ctx: TemplateContext) {
  switch (part._tag) {
    case "attr":
      return setupAttrPart(part, path, ctx, ctx.values[part.index])
    case "boolean-part":
      return setupBooleanPart(part, path, ctx, ctx.values[part.index])
    case "className-part":
      return setupClassNamePart(part, path, ctx, ctx.values[part.index])
    case "comment-part":
      return setupCommentPart(part, path, ctx)
    case "data":
      return setupDataPart(part, path, ctx, ctx.values[part.index])
    case "event":
      return setupEventPart(part, path, ctx, ctx.values[part.index])
    case "node":
      return setupNodePart(part, path, ctx)
    case "properties":
      return setupPropertiesPart(part, path, ctx)
    case "property":
      return setupPropertyPart(part, path, ctx, ctx.values[part.index])
    case "ref":
      return setupRefPart(part, path, ctx)
    case "sparse-attr":
      return setupSparseAttrPart(part, path, ctx)
    case "sparse-class-name":
      return setupSparseClassNamePart(part, path, ctx)
    case "sparse-comment":
      return setupSparseCommentPart(part, path, ctx)
    case "text-part":
      return setupTextPart(part, path, ctx)
  }
}

function setupAttrPart(
  { index, name }: Pick<Template.AttrPartNode, "index" | "name">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const attr = element.getAttributeNode(name) ?? ctx.document.createAttribute(name)
  const part = SyncPartsInternal.makeAttributePart(index, element, attr)
  return matchSyncPart(renderable, ctx, part)
}

function setupBooleanPart(
  { index, name }: Pick<Template.BooleanPartNode, "index" | "name">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const part = SyncPartsInternal.makeBooleanAttributePart(name, index, element)
  return matchSyncPart(renderable, ctx, part)
}

function setupClassNamePart(
  { index }: Pick<Template.ClassNamePartNode, "index">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const part = SyncPartsInternal.makeClassNamePart(index, element)
  return matchSyncPart(renderable, ctx, part)
}

function setupCommentPart(
  { index }: Pick<Template.CommentPartNode, "index">,
  path: Chunk<number>,
  ctx: TemplateContext
) {
  const element = findPath(ctx.content, path) as Comment
  const part = SyncPartsInternal.makeCommentPart(index, element)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

function setupDataPart(
  { index }: Pick<Template.DataPartNode, "index">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const part = SyncPartsInternal.makeDataPart(index, element)
  return matchSyncPart(renderable, ctx, part)
}

function setupEventPart(
  { index, name }: Pick<Template.EventPartNode, "index" | "name">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  if (isNullOrUndefined(renderable)) return null

  const element = findPath(ctx.content, path) as HTMLElement | SVGElement

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

function getEventHandler<E, R>(
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

function setupNodePart(
  { index }: Template.NodePart,
  path: Chunk<number>,
  ctx: TemplateContext
) {
  const comment = findPath(ctx.content, path) as Comment
  const part = SyncPartsInternal.makeNodePart(index, comment, ctx.document, false)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

function setupPropertyPart(
  { index, name }: Pick<Template.PropertyPartNode, "index" | "name">,
  path: Chunk<number>,
  ctx: TemplateContext,
  renderable: Renderable<any, any>
) {
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const part = SyncPartsInternal.makePropertyPart(name, index, element)
  return matchSyncPart(renderable, ctx, part)
}

function setupRefPart({ index }: Pick<Template.RefPartNode, "index">, path: Chunk<number>, ctx: TemplateContext) {
  const renderable = ctx.values[index]

  if (isNullOrUndefined(renderable)) return null
  else if (isDirective(renderable)) {
    return renderable(
      new RefPartImpl(ElementSource.fromElement(findPath(ctx.content, path) as HTMLElement | SVGElement), index)
    )
  } else if (ElementRef.isElementRef(renderable)) {
    // TODO: We need to enable only setting these values once the Template has been rendered into the DOM
    return ElementRef.set(renderable, findPath(ctx.content, path) as HTMLElement | SVGElement)
  } else {
    return null
  }
}

function setupPropertiesPart(
  { index }: Pick<Template.PropertiesPartNode, "index">,
  path: Chunk<number>,
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
      const index = ++ctx.templateIndex
      switch (type) {
        case "attr":
          addEffect(setupAttrPart({ index, name }, path, ctx, value))
          break
        case "boolean":
          addEffect(setupBooleanPart({ index, name }, path, ctx, value))
          break
        case "class":
          addEffect(setupClassNamePart({ index }, path, ctx, value))
          break
        case "data":
          addEffect(setupDataPart({ index }, path, ctx, value))
          break
        case "event":
          addEffect(setupEventPart({ index, name }, path, ctx, value))
          break
        case "property":
          addEffect(setupPropertyPart({ index, name }, path, ctx, value))
          break
      }
    }

    return Effect.all(effects, { concurrency: "unbounded" })
  }

  return null
}

function setupSparseAttrPart(
  { name, nodes }: Template.SparseAttrNode,
  path: Chunk<number>,
  ctx: TemplateContext
) {
  ctx.expected++
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const attr = element.getAttributeNode(name) ?? ctx.document.createAttribute(name)
  const index = nodes.find((n): n is Template.AttrPartNode => n._tag === "attr")!.index
  const id = Symbol(index)
  return SyncPartsInternal.handleSparseAttribute(
    element,
    attr,
    nodes,
    (f) => Effect.zipRight(ctx.queue.add(id, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

function setupSparseClassNamePart(
  { nodes }: Template.SparseClassNameNode,
  path: Chunk<number>,
  ctx: TemplateContext
) {
  ctx.expected++
  const element = findPath(ctx.content, path) as HTMLElement | SVGElement
  const index = nodes.find((n): n is Template.ClassNamePartNode => n._tag === "className-part")!.index
  const id = Symbol(index)
  return SyncPartsInternal.handleSparseClassName(
    element,
    nodes,
    (f) => Effect.zipRight(ctx.queue.add(id, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

function setupSparseCommentPart({ nodes }: Template.SparseCommentNode, path: Chunk<number>, ctx: TemplateContext) {
  ctx.expected++
  const comment = findPath(ctx.content, path) as Comment
  const index = nodes.find((n): n is Template.CommentPartNode => n._tag === "comment-part")!.index
  const id = Symbol(index)
  return SyncPartsInternal.handleSparseComment(
    comment,
    nodes,
    (f) => Effect.zipRight(ctx.queue.add(id, f, DEFAULT_PRIORITY), ctx.refCounter.release(index))
  )
}

function setupTextPart({ index }: Template.TextPartNode, path: Chunk<number>, ctx: TemplateContext) {
  const comment = findPath(ctx.content, path) as Comment
  const text = ctx.document.createTextNode("")
  comment.parentNode!.insertBefore(text, comment)
  const part = SyncPartsInternal.makeTextPart(index, text)
  const renderable = ctx.values[index]
  return matchSyncPart(renderable, ctx, part)
}

function matchSyncPart(
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

function runSyncUpdate(
  syncPart: SyncPart,
  value: any,
  ctx: TemplateContext
) {
  return Effect.zipRight(
    ctx.queue.add(syncPart, () => syncPart.update(value as never), DEFAULT_PRIORITY),
    ctx.refCounter.release(syncPart.index)
  )
}

function matchRenderable(
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
  } else {
    return matches.Otherwise(renderable)
  }
}
