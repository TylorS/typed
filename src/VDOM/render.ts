import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Equivalence from '@tsplus/stdlib/prelude/Equivalence'
import * as Fx from '@typed/fx'

import { createElement, createTextNode } from '../DOM/Document.js'

import { PropsOf, VNode, VNodeChild, VNodeChildren } from './VNode.js'

export type Rendered = HTMLElement | SVGElement | Element | Text | Comment

const PREVIOUS_PROPS = Symbol('PREVIOUS_PROPS')
const PREVIOUS_CHILDREN = Symbol('PREVIOUS_CHILDREN')

export function render<R, E>(vNode: VNode<R, E>): Fx.Fx<R | Document, E, Rendered> {
  if (vNode.type === 'text') {
    if (isFx<R, E, string>(vNode.textContent)) {
      return pipe(
        vNode.textContent,
        Fx.skipRepeats(Equivalence.string),
        Fx.snapshot(
          Fx.fromEffect(createTextNode('')),
          (t, context) => ((t.textContent = context), t),
        ),
        Fx.skipRepeats<Rendered>(Equivalence.any),
      )
    }

    return Fx.fromEffect(createTextNode(vNode.textContent))
  }

  if (vNode.type === 'element') {
    const elem = Fx.multicast(Fx.fromEffect(createElement(vNode.tag)))
    const vNodeProps = wrapElementProps(vNode.props)
    const vNodeChildren = wrapElementChildren(vNode.children)

    return pipe(
      Fx.combineAll([elem, vNodeProps, vNodeChildren]),
      Fx.mapEffect(([e, p, c]) => Effect.sync(() => renderElement(e, p, c))), // TODO: Separate Prop/Children updating
      Fx.skipRepeats<Rendered>(Equivalence.any),
    )
  }

  // TODO: Should never get here
  return Fx.dieMessage('Unknown VNode type')
}

function wrapElementProps<R, E>(props: PropsOf<any, R, E>): Fx.Fx<R, E, Record<string, any>> {
  const keys = Object.keys(props)

  if (keys.length === 0) {
    return Fx.succeed({})
  }

  const result: Record<string, Fx.Fx<R, E, any>> = {}

  for (const key of keys) {
    const value = (props as any)[key]

    if (isFx<R, E, any>(value)) {
      result[key] = value
    } else {
      result[key] = Fx.succeed(value)
    }
  }

  return Fx.struct(result)
}

function isFx<R, E, A>(value: A | Fx.Fx<R, E, A>): value is Fx.Fx<R, E, A> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'run' in value &&
    typeof value['run'] === 'function' &&
    value['run'].length === 1
  )
}

function wrapElementChildren<R, E>(
  children: VNodeChildren<R, E>,
): Fx.Fx<R | Document, E, readonly Rendered[]> {
  // TODO: We should optimize this somehow to avoid recreating inner children + create diffs
  if (isFx(children)) {
    return pipe(children, Fx.switchMap(wrapElementChildren))
  }

  return children.length === 0 ? Fx.succeed([]) : Fx.combineAll(children.map(vNodeChild))
}

function vNodeChild<R, E>(child: VNodeChild<R, E>): Fx.Fx<R | Document, E, Rendered> {
  if (isFx<R, E, VNode<R, E>>(child)) {
    return pipe(child, Fx.switchMap(render))
  }

  return render(child)
}

function renderElement(e: Element, p: Record<string, any>, c: readonly Rendered[]): Element {
  for (const key in p) {
    if ((e as any)[key] !== p[key]) {
      ;(e as any)[key] = p[key]
    }
  }

  if (PREVIOUS_PROPS in e && (e as any)[PREVIOUS_PROPS] !== p) {
    for (const key in (e as any)[PREVIOUS_PROPS]) {
      if (!(key in p)) {
        delete (e as any)[key]
      }
    }
  }

  if (PREVIOUS_CHILDREN in e) {
    // TODO: Handle Reordering/Removing children
  } else {
    for (const child of c) {
      e.appendChild(child)
    }
  }

  ;(e as any)[PREVIOUS_PROPS] = p
  ;(e as any)[PREVIOUS_CHILDREN] = c

  return e
}
