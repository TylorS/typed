import * as Fx from "@typed/fx/Fx"
import * as Sink from "@typed/fx/Sink"
import { TypeId } from "@typed/fx/TypeId"
import type { Rendered } from "@typed/wire"
import { persistent } from "@typed/wire"
import { Effect, ExecutionStrategy, Exit, Runtime } from "effect"
import type { Cause } from "effect/Cause"
import type { Chunk } from "effect/Chunk"
import * as Context from "effect/Context"
import { hasProperty } from "effect/Predicate"
import * as Scope from "effect/Scope"
import { uncapitalize } from "effect/String"
import type { Directive } from "../Directive.js"
import { isDirective } from "../Directive.js"
import * as ElementRef from "../ElementRef.js"
import * as ElementSource from "../ElementSource.js"
import type { BrowserEntry } from "../Entry.js"
import * as EventHandler from "../EventHandler.js"
import type { Part } from "../Part.js"
import type { Placeholder } from "../Placeholder.js"
import type { ToRendered } from "../Render.js"
import type { Renderable } from "../Renderable.js"
import type { RenderContext } from "../RenderContext.js"
import type { RenderEvent } from "../RenderEvent.js"
import { DomRenderEvent } from "../RenderEvent.js"
import { RenderQueue, withCurrentPriority } from "../RenderQueue.js"
import type { RenderTemplate } from "../RenderTemplate.js"
import type * as Template from "../Template.js"
import { makeRenderNodePart } from "./browser.js"
import { type EventSource, makeEventSource } from "./EventSource.js"
import { HydrateContext } from "./HydrateContext.js"
import type { IndexRefCounter2 } from "./indexRefCounter.js"
import { indexRefCounter2 } from "./indexRefCounter.js"
import { parse } from "./parser.js"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  PropertyPartImpl,
  RefPartImpl,
  TextPartImpl
} from "./parts.js"
import type { ParentChildNodes } from "./utils.js"
import { findPath } from "./utils.js"

/**
 * @internal
 */
export type RenderPartContext = {
  readonly context: Context.Context<Scope.Scope>
  readonly document: Document
  readonly eventSource: EventSource
  readonly refCounter: IndexRefCounter2
  readonly renderContext: RenderContext
  readonly queue: RenderQueue
  readonly values: ReadonlyArray<Renderable<any, any>>
  readonly onCause: (cause: Cause<any>) => Effect.Effect<void>

  readonly makeHydrateContext?: (index: number) => HydrateContext

  expected: number
  spreadIndex: number
}

type RenderPartMap = {
  readonly [K in Template.PartNode["_tag"] | Template.SparsePartNode["_tag"]]: (
    part: Extract<Template.PartNode | Template.SparsePartNode, { _tag: K }>,
    node: Node,
    ctx: RenderPartContext
  ) => null | Effect.Effect<void, any, any> | Array<Effect.Effect<void, any, any>>
}

const RenderPartMap: RenderPartMap = {
  "attr": (templatePart, node, ctx) => {
    const { document, queue, refCounter, values } = ctx
    const element = node as HTMLElement | SVGElement
    const attr = createAttribute(document, element, templatePart.name)
    const renderable = values[templatePart.index]
    let isSet = false
    const setValue = (value: string | null | undefined) => {
      if (isNullOrUndefined(value)) {
        element.removeAttribute(templatePart.name)
        isSet = false
      } else {
        attr.value = String(value)
        if (isSet === false) {
          element.setAttributeNode(attr)
          isSet = true
        }
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => AttributePartImpl.browser(templatePart.index, element, templatePart.name, queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(queue.add(element, f, priority), refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "boolean-part": (templatePart, node, ctx) => {
    const { queue, refCounter, values } = ctx
    const element = node as HTMLElement | SVGElement
    const name = templatePart.name
    const renderable = values[templatePart.index]
    const setValue = (value: boolean | null | undefined) => {
      element.toggleAttribute(name, isNullOrUndefined(value) ? false : Boolean(value))
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => BooleanPartImpl.browser(templatePart.index, element, name, queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(queue.add(element, f, priority), refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "className-part": (templatePart, node, ctx) => {
    const { queue, refCounter, values } = ctx
    const element = node as HTMLElement | SVGElement
    const renderable = values[templatePart.index]
    let classNames: Set<string> = new Set()
    const setValue = (value: string | Array<string> | null | undefined) => {
      if (isNullOrUndefined(value)) {
        element.classList.remove(...classNames)
        classNames.clear()
      } else {
        const newClassNames = new Set(
          Array.isArray(value) ? value.flatMap((x) => splitClassNames(String(x))) : splitClassNames(String(value))
        )
        const { added, removed } = diffClassNames(classNames, newClassNames)

        element.classList.remove(...removed)
        element.classList.add(...added)
        classNames = newClassNames
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => ClassNamePartImpl.browser(templatePart.index, element, queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(queue.add(element, f, priority), refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "comment-part": (templatePart, node, ctx) => {
    const { queue, refCounter, values } = ctx
    const comment = node as Comment
    const renderable = values[templatePart.index]
    const setValue = (value: string | null | undefined) => {
      comment.nodeValue = isNullOrUndefined(value) ? "" : String(value)
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => CommentPartImpl.browser(templatePart.index, comment, queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(queue.add(comment, f, priority), refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "data": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const previousKeys = new Set<string>(Object.keys(element.dataset))
    const setValue = (value: Record<string, string | undefined> | null | undefined) => {
      if (isNullOrUndefined(value)) {
        for (const key of previousKeys) {
          delete element.dataset[key]
        }
        previousKeys.clear()
      } else {
        for (const key of previousKeys) {
          if (!(key in value)) {
            delete element.dataset[key]
            previousKeys.delete(key)
          }
        }

        for (const key of Object.keys(value)) {
          if (!previousKeys.has(key)) {
            previousKeys.add(key)
          }
          element.dataset[key] = value[key] || ""
        }
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => DataPartImpl.browser(templatePart.index, element, ctx.queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "event": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const handler = getEventHandler(renderable, ctx.context, ctx.onCause)
    if (handler) {
      ctx.eventSource.addEventListener(element, templatePart.name, handler)
    }

    return null
  },
  "node": (templatePart, node, ctx) => {
    const makeHydrateContext = ctx.makeHydrateContext
    const renderable = ctx.values[templatePart.index]
    const part = makeRenderNodePart(
      templatePart.index,
      node as HTMLElement | SVGElement,
      ctx.queue,
      ctx.document,
      !!makeHydrateContext
    )

    if (isDirective(renderable)) {
      const effect = Effect.zipRight(renderable(part), ctx.refCounter.release(templatePart.index))
      if (makeHydrateContext) {
        return Effect.provideService(effect, HydrateContext, makeHydrateContext(templatePart.index))
      } else {
        return effect
      }
    }

    ctx.expected++

    const handle = handlePart(
      renderable,
      Sink.make(
        ctx.onCause,
        (value) =>
          withCurrentPriority((priority) =>
            Effect.zipRight(part.update(value, priority), ctx.refCounter.release(templatePart.index))
          )
      )
    )

    if (makeHydrateContext) {
      return Effect.provideService(handle, HydrateContext, makeHydrateContext(templatePart.index))
    } else {
      return handle
    }
  },
  "property": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]
    const setValue = (value: unknown) => {
      if (isNullOrUndefined(value)) {
        delete (element as any)[templatePart.name]
      } else {
        ;(element as any)[templatePart.name] = value
      }
    }

    return matchSettablePart(
      renderable,
      setValue,
      () => PropertyPartImpl.browser(templatePart.index, element, templatePart.name, ctx.queue),
      (f) =>
        withCurrentPriority((priority) =>
          Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(templatePart.index))
        ),
      () => ctx.expected++
    )
  },
  "properties": (templatePart, node, ctx) => {
    const renderable = ctx.values[templatePart.index] as any as Record<string, any>
    if (isNullOrUndefined(renderable)) return null
    else if (Fx.isFx(renderable) || Effect.isEffect(renderable)) {
      throw new Error(`Properties Part must utilize an Record of renderable values.`)
    } else if (typeof renderable === "object" && !Array.isArray(renderable)) {
      const element = node as HTMLElement | SVGElement

      const toggleBoolean = (key: string, value: unknown) => {
        element.toggleAttribute(key, isNullOrUndefined(value) ? false : Boolean(value))
      }
      const setAttribute = (key: string, value: unknown) => {
        if (isNullOrUndefined(value)) {
          element.removeAttribute(key)
        } else {
          element.setAttribute(key, String(value))
        }
      }
      const setProperty = (key: string, value: unknown) => {
        if (isNullOrUndefined(value)) {
          delete (element as any)[key]
        } else {
          ;(element as any)[key] = value
        }
      }
      const setClassNames = (previous: Set<string>, updated: Set<string>) => {
        const { added, removed } = diffClassNames(previous, updated)

        element.classList.remove(...removed)
        element.classList.add(...added)
        removed.forEach((r) => previous.delete(r))
        added.forEach((a) => previous.add(a))
      }

      const effects: Array<Effect.Effect<void, any, any>> = []
      const entries = Object.entries(renderable)

      loop:
      for (const [key, value] of entries) {
        const index = ++ctx.spreadIndex
        switch (key[0]) {
          case "?": {
            const name = key.slice(1)
            const eff = matchSettablePart(
              value,
              (value) => toggleBoolean(name, value),
              () => BooleanPartImpl.browser(index, element, name, ctx.queue),
              (f) =>
                withCurrentPriority((priority) =>
                  Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(index))
                ),
              () => ctx.expected++
            )
            if (eff !== null) {
              effects.push(eff)
            }
            continue loop
          }
          case ".": {
            const name = key.slice(1)
            const eff = matchSettablePart(
              value,
              (value) => setProperty(name, value),
              () => PropertyPartImpl.browser(index, element, name, ctx.queue),
              (f) =>
                withCurrentPriority((priority) =>
                  Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(index))
                ),
              () => ctx.expected++
            )
            if (eff !== null) {
              effects.push(eff)
            }
            continue loop
          }
          case "@": {
            const name = uncapitalize(key.slice(1))
            const handler = getEventHandler(value, ctx.context, ctx.onCause)
            if (handler) {
              ctx.eventSource.addEventListener(element, name, handler)
            }
            continue loop
          }
          case "o": {
            if (key[1] === "n") {
              const name = uncapitalize(key.slice(2))
              const handler = getEventHandler(value, ctx.context, ctx.onCause)
              if (handler) {
                ctx.eventSource.addEventListener(element, name, handler)
              }
            }
            continue loop
          }
        }

        const lowerCaseName = key.toLowerCase()

        const isClass = lowerCaseName === "class" || lowerCaseName === "classname"

        if (isClass) {
          const classNames: Set<string> = new Set()
          const eff = matchSettablePart(
            value,
            (value) => {
              if (isNullOrUndefined(value)) {
                element.classList.remove(...classNames)
                classNames.clear()
              } else {
                setClassNames(classNames, new Set(splitClassNames(String(value))))
              }
            },
            () => ClassNamePartImpl.browser(index, element, ctx.queue),
            (f) =>
              withCurrentPriority((priority) =>
                Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(index))
              ),
            () => ctx.expected++
          )
          if (eff !== null) {
            effects.push(eff)
          }
        } else {
          const eff = matchSettablePart(
            value,
            (value) => setAttribute(key, value),
            () => AttributePartImpl.browser(index, element, key, ctx.queue),
            (f) =>
              withCurrentPriority((priority) =>
                Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(index))
              ),
            () => ctx.expected++
          )
          if (eff !== null) {
            effects.push(eff)
          }
        }
      }

      return effects
    } else {
      return null
    }
  },
  "ref": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement
    const renderable = ctx.values[templatePart.index]

    if (isDirective(renderable)) {
      return renderable(new RefPartImpl(ElementSource.fromElement(element), templatePart.index))
    } else if (ElementRef.isElementRef(renderable)) {
      return ElementRef.set(renderable, element)
    }

    return null
  },
  "sparse-attr": (templatePart, node, ctx) => {
    const values = Array.from({ length: templatePart.nodes.length }, (): string => "")
    const element = node as HTMLElement | SVGElement
    const attr = createAttribute(ctx.document, element, templatePart.name)

    const setValue = (value: string | null | undefined, index: number) => {
      values[index] = value ?? ""
    }

    const effects: Array<Effect.Effect<void, any, any>> = []

    for (let i = 0; i < templatePart.nodes.length; ++i) {
      const node = templatePart.nodes[i]
      if (node._tag === "text") {
        values[i] = node.value
      } else {
        const renderable = ctx.values[node.index]
        const index = i
        const effect = matchSettablePart(
          renderable,
          (value) => setValue(value, index),
          () =>
            new AttributePartImpl(
              templatePart.name,
              node.index,
              ({ value }, priority) =>
                Effect.zipRight(
                  ctx.queue.add(element, () => setValue(value, index), priority),
                  ctx.refCounter.release(node.index)
                ),
              attr.value
            ),
          (f) =>
            withCurrentPriority((priority) =>
              Effect.zipRight(ctx.queue.add(element, f, priority), ctx.refCounter.release(node.index))
            ),
          () => ctx.expected++
        )

        if (effect !== null) {
          effects.push(effect)
        }
      }
    }

    if (effects.length === 0) {
      attr.value = values.join("")
      element.setAttributeNode(attr)
    }

    return effects
  },
  "sparse-class-name": (templatePart, node, ctx) => {
    const element = node as HTMLElement | SVGElement

    const effects = templatePart.nodes.flatMap((node) => {
      if (node._tag === "text") {
        const split = splitClassNames(node.value)
        if (split.length > 0) element.classList.add(...split)
        return []
      } else {
        const eff = RenderPartMap[node._tag](node, element, ctx)
        if (eff === null) return []
        return Array.isArray(eff) ? eff : [eff]
      }
    })

    return effects
  },
  "sparse-comment": (templatePart, node, ctx) => {
    const values = Array.from({ length: templatePart.nodes.length }, (): string => "")
    const comment = node as Comment

    const setValue = (value: string | null | undefined, index: number) => {
      values[index] = value ?? ""
    }
    const flushValue = () => {
      comment.data = values.join("")
    }

    const effects: Array<Effect.Effect<void, any, any>> = []

    for (let i = 0; i < templatePart.nodes.length; ++i) {
      const node = templatePart.nodes[i]
      if (node._tag === "text") {
        values[i] = node.value
      } else {
        const renderable = ctx.values[node.index]
        const index = i
        const effect = matchSettablePart(
          renderable,
          (value) => {
            setValue(value, index)
            flushValue()
          },
          () =>
            new CommentPartImpl(
              node.index,
              ({ value }, priority) => (setValue(value, index),
                Effect.zipRight(
                  ctx.queue.add(comment, () => flushValue(), priority),
                  ctx.refCounter.release(node.index)
                )),
              null
            ),
          (f) =>
            withCurrentPriority((priority) =>
              Effect.zipRight(ctx.queue.add(comment, f, priority), ctx.refCounter.release(node.index))
            ),
          () => ctx.expected++
        )

        if (effect !== null) {
          effects.push(effect)
        }
      }
    }

    if (effects.length === 0) {
      flushValue()
    }

    return effects
  },
  "text-part": (templatePart, node, ctx) => {
    const renderable = ctx.values[templatePart.index]
    const part = TextPartImpl.browser(
      ctx.document,
      templatePart.index,
      node as HTMLElement | SVGElement,
      ctx.queue
    )

    if (isDirective(renderable)) {
      return Effect.zipRight(renderable(part), ctx.refCounter.release(templatePart.index))
    }

    ctx.expected++

    return handlePart(
      renderable,
      Sink.make(
        ctx.onCause,
        (value) =>
          withCurrentPriority((priority) =>
            Effect.zipRight(part.update(value as any, priority), ctx.refCounter.release(templatePart.index))
          )
      )
    )
  }
}

const SPACE_REGEXP = /\s+/g

function splitClassNames(value: string) {
  return value.split(SPACE_REGEXP).flatMap((a) => {
    const trimmed = a.trim()
    return trimmed.length > 0 ? [trimmed] : []
  })
}

function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

function diffClassNames(oldClassNames: Set<string>, newClassNames: Set<string>) {
  const added: Array<string> = []
  const removed: Array<string> = []

  for (const className of oldClassNames) {
    if (!newClassNames.has(className)) {
      removed.push(className)
    }
  }

  for (const className of newClassNames) {
    if (!oldClassNames.has(className) && className.trim()) {
      added.push(className)
    }
  }

  return { added, removed }
}

/**
 * @internal
 */
export function renderPart2(
  part: Template.PartNode | Template.SparsePartNode,
  content: ParentChildNodes,
  path: Chunk<number>,
  ctx: RenderPartContext
): Effect.Effect<void, any, any> | Array<Effect.Effect<void, any, any>> | null {
  return RenderPartMap[part._tag](part as any, findPath(content, path), ctx)
}

/**
 * Here for "standard" browser rendering, a TemplateInstance is effectively a live
 * view into the contents rendered by the Template.
 */
export const renderTemplate: (document: Document, renderContext: RenderContext) => RenderTemplate =
  (document, renderContext) =>
  <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ) => {
    const entry = getBrowserEntry(document, renderContext, templateStrings)
    if (values.length === 0) {
      return Fx.sync(() => DomRenderEvent(persistent(document, document.importNode(entry.content, true))))
    }

    return Fx.make<
      RenderEvent,
      Placeholder.Error<Values[number]>,
      Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>
    >((
      sink
    ) => {
      return Effect.gen(function*(_) {
        const runtime = yield* _(Effect.runtime<Scope.Scope | RenderQueue | Placeholder.Context<Values[number]>>())
        const runFork = Runtime.runFork(runtime)
        const parentScope = Context.get(runtime.context, Scope.Scope)
        const scope = yield* _(Scope.fork(parentScope, ExecutionStrategy.sequential))
        const queue = Context.get(runtime.context, RenderQueue)
        const refCounter = yield* _(indexRefCounter2())
        const content = document.importNode(entry.content, true)
        const ctx: RenderPartContext = {
          context: runtime.context,
          document,
          eventSource: makeEventSource(),
          expected: 0,
          queue,
          refCounter,
          renderContext,
          onCause: sink.onFailure as any,
          spreadIndex: values.length,
          values
        }

        // Connect our interpolated values to our template parts
        const effects: Array<Effect.Effect<void, never, Scope.Scope | Placeholder.Context<Values[number]>>> = []
        for (const [part, path] of entry.template.parts) {
          const eff = renderPart2(part, content, path, ctx)
          if (eff !== null) {
            effects.push(
              ...(Array.isArray(eff) ? eff : [eff]) as Array<
                Effect.Effect<void, never, Scope.Scope | Placeholder.Context<Values[number]>>
              >
            )
          }
        }

        // Fork any effects necessary
        if (effects.length > 0) {
          for (let i = 0; i < effects.length; ++i) {
            runFork(Effect.catchAllCause(effects[i], sink.onFailure), { scope })
          }
        }

        // If there's anything to wait on and it's not already done, wait for an initial value
        // for all asynchronous sources.
        if (ctx.expected > 0 && (yield* _(refCounter.expect(ctx.expected)))) {
          yield* _(refCounter.wait)
        }

        // Create a persistent wire from our content
        const wire = persistent(document, content)

        // Setup our event listeners for our wire.
        // We use the parentScope to allow event listeners to exist
        // beyond the lifetime of the current Fiber, but no further than its parent template.
        yield* _(ctx.eventSource.setup(wire, parentScope))

        // Emit our DomRenderEvent
        yield* _(
          sink.onSuccess(DomRenderEvent(wire)),
          // Ensure our templates last forever in the DOM environment
          // so event listeners are kept attached to the current Scope.
          Effect.zipRight(Effect.never),
          // Close our scope whenever the current Fiber is interrupted
          Effect.ensuring(Scope.close(scope, Exit.unit))
        )
      })
    })
  }

function getEventHandler<E, R>(
  renderable: any,
  ctx: Context.Context<any> | Context.Context<never>,
  onCause: (cause: Cause<E>) => Effect.Effect<unknown>
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

function handlePart<R, E, R2>(
  renderable: unknown,
  sink: Sink.Sink<any, any, R2>
): Effect.Effect<any, never, R | R2 | Scope.Scope> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return sink.onSuccess(null)
      else if (Array.isArray(renderable)) {
        return renderable.length === 0
          ? sink.onSuccess(null)
          : Fx.tuple(renderable.map(unwrapRenderable)).run(sink) as any
      } else if (TypeId in renderable) {
        return (renderable as Fx.Fx<any, any, R | R2>).run(sink)
      } else if (Effect.EffectTypeId in renderable) {
        return Effect.matchCauseEffect(renderable as Effect.Effect<any, E, R>, sink)
      } else return sink.onSuccess(renderable)
    }
    default:
      return sink.onSuccess(renderable)
  }
}

function unwrapRenderable<E, R>(renderable: unknown): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return Fx.succeed(null)
      else if (Array.isArray(renderable)) {
        return renderable.length === 0
          ? Fx.succeed(null)
          : Fx.map(Fx.tuple(renderable.map(unwrapRenderable)), (xs) => xs.flat()) as any
      } else if (TypeId in renderable) {
        return renderable as any
      } else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(Effect.map(renderable as any, unwrapRenderable<E, R>))
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}

export function attachRoot<T extends RenderEvent | null>(
  cache: RenderContext["renderCache"],
  where: HTMLElement,
  what: RenderEvent | null // TODO: Should we support HTML RenderEvents here too?
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

function removeChildren(where: HTMLElement, previous: Rendered) {
  for (const node of getNodes(previous)) {
    where.removeChild(node)
  }
}

function replaceChildren(where: HTMLElement, wire: Rendered) {
  where.replaceChildren(...getNodes(wire))
}

function getNodes(rendered: Rendered): Array<globalThis.Node> {
  const value = rendered.valueOf() as globalThis.Node | Array<globalThis.Node>
  return Array.isArray(value) ? value : [value]
}

export function getBrowserEntry(
  document: Document,
  ctx: RenderContext,
  templateStrings: TemplateStringsArray
): BrowserEntry {
  const cached = ctx.templateCache.get(templateStrings)

  if (cached === undefined || cached._tag === "Server") {
    const template = parse(templateStrings)
    const content = buildTemplate(document, template)
    const entry: BrowserEntry = {
      _tag: "Browser",
      template,
      content
    }

    ctx.templateCache.set(templateStrings, entry)

    return entry
  } else {
    return cached
  }
}

export function buildTemplate(document: Document, { nodes }: Template.Template): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < nodes.length; ++i) {
    fragment.append(buildNode(document, nodes[i], false))
  }

  return fragment
}

function buildNode(document: Document, node: Template.Node, isSvgContext: boolean): globalThis.Node {
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return buildElement(document, node, isSvgContext)
    case "text":
      return document.createTextNode(node.value)
    case "comment":
      return document.createComment(node.value)
    case "sparse-comment":
      return document.createComment(`hole${node.nodes.map((n) => n._tag === "text" ? "" : n.index).join("")}`)
    // Create placeholders for these elements
    case "comment-part":
    case "node":
      return document.createComment(`hole${node.index}`)
    case "doctype":
      return document.implementation.createDocumentType(
        node.name,
        docTypeNameToPublicId(node.name),
        docTypeNameToSystemId(node.name)
      )
  }
}

function docTypeNameToPublicId(name: string): string {
  switch (name) {
    case "html":
      return "-//W3C//DTD HTML 4.01//EN"
    case "svg":
      return "-//W3C//DTD SVG 1.1//EN"
    case "math":
      return "-//W3C//DTD MathML 2.0//EN"
    default:
      return ""
  }
}

function docTypeNameToSystemId(name: string): string {
  switch (name) {
    // HTML5
    case "html":
      return "http://www.w3.org/TR/html4/strict.dtd"
    case "svg":
      return "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"
    case "math":
      return "http://www.w3.org/Math/DTD/mathml2/mathml2.dtd"
    default:
      return ""
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

function buildElement(
  document: Document,
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
  isSvgContext: boolean
): Element {
  const { _tag, attributes, tagName } = node
  const isSvg = isSvgContext ? tagName !== "foreignObject" : tagName === "svg"
  const element = isSvg
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName)

  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr._tag === "attribute") {
      element.setAttribute(attr.name, attr.value)
    } else if (attr._tag === "boolean") {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (_tag === "element") {
    element.append(...node.children.map((child) => buildNode(document, child, isSvg)))
  } else if (_tag === "text-only-element") {
    element.append(...node.children.map((child) => buildTextChild(document, child)))
  }

  return element
}

function buildTextChild(document: Document, node: Template.Text): globalThis.Node {
  if (node._tag === "text") {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}

function createAttribute(
  document: Document,
  element: HTMLElement | SVGElement,
  name: string
): Attr {
  return element.getAttributeNode(name) ?? document.createAttribute(name)
}

function matchSettablePart(
  renderable: Renderable<any, any>,
  setValue: (value: any) => void,
  makePart: () => Part,
  schedule: (f: () => void) => Effect.Effect<void, never, Scope.Scope>,
  expect: () => void
) {
  return matchRenderable(renderable, {
    Fx: (fx) => {
      expect()
      return Fx.observe(fx, (a) => schedule(() => setValue(a)))
    },
    Effect: (effect) => {
      expect()
      return Effect.flatMap(effect, (a) => schedule(() => setValue(a)))
    },
    Directive: (directive) => {
      expect()
      const part = makePart()
      return runDirective(directive, part, setValue, schedule)
    },
    Otherwise: (otherwise) => {
      setValue(otherwise)
      return null
    }
  })
}

function matchRenderable(renderable: Renderable<any, any>, matches: {
  Fx: (fx: Fx.Fx<any, any, any>) => Effect.Effect<void, any, any> | null
  Effect: (effect: Effect.Effect<any, any, any>) => Effect.Effect<void, any, any> | null
  Directive: (directive: Directive<any, any>) => Effect.Effect<void, any, any> | null
  Otherwise: (_: Renderable<any, any>) => Effect.Effect<void, any, any> | null
}): Effect.Effect<void, any, any> | null {
  if (Fx.isFx(renderable)) {
    return matches.Fx(renderable)
  } else if (Effect.isEffect(renderable)) {
    return matches.Effect(renderable)
  } else if (isDirective<any, any>(renderable)) {
    return matches.Directive(renderable)
  } else {
    return matches.Otherwise(renderable)
  }
}

function runDirective(
  directive: Directive<any, any>,
  part: Part,
  setValue: (value: any) => void,
  schedule: (f: () => void) => Effect.Effect<void, never, Scope.Scope>
): Effect.Effect<void, any, any> {
  if (hasProperty(part, "update")) {
    return directive({ ...part, update: (value: any) => schedule(() => setValue(value)) })
  } else {
    return Effect.flatMap(directive(part), () => schedule(() => setValue(part.value)))
  }
}
