import { identity } from "effect/Function"
import type { ElementSource } from "../../ElementSource.js"
import type { AttrPartNode, ClassNamePartNode, CommentPartNode, TextNode } from "../../Template.js"
import { convertCharacterEntities } from "../character-entities.js"
import type { AttributePart, ClassNamePart, CommentPart } from "./Part.js"
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

export function makeAttributePart(
  name: string,
  index: number,
  element: HTMLElement | SVGElement,
  attr: Attr
) {
  let isSet = false
  const setValue = (value: string | null | undefined) => {
    if (isNullOrUndefined(value)) {
      element.removeAttribute(name)
      isSet = false
    } else {
      attr.value = value
      if (isSet === false) {
        element.setAttributeNode(attr)
        isSet = true
      }
    }
  }

  return new AttributePartImpl(name, index, ({ value }) => setValue(value), element.getAttribute(name))
}

export function makeBooleanAttributePart(
  name: string,
  index: number,
  element: HTMLElement | SVGElement
) {
  return new BooleanPartImpl(
    name,
    index,
    ({ value }) => element.toggleAttribute(name, value === true),
    element.hasAttribute(name)
  )
}

export function makeClassNamePart(
  index: number,
  element: HTMLElement | SVGElement,
  initial: ReadonlyArray<string> = Array.from(element.classList)
) {
  return new ClassNamePartImpl(
    index,
    ({ previous, value }) => {
      const { added, removed } = diffStrings(previous, value)
      element.classList.add(...added)
      element.classList.remove(...removed)
    },
    initial
  )
}

export function makeDataPart(index: number, element: HTMLElement | SVGElement) {
  return new DataPartImpl(
    index,
    ({ previous, value }) => {
      const diff = diffDataSet(previous, value)
      if (diff) {
        const { added, removed } = diff
        removed.forEach((k) => delete element.dataset[k])
        added.forEach(([k, v]) => element.dataset[k] = v)
      }
    },
    element.dataset
  )
}

export function makePropertyPart(name: string, index: number, element: HTMLElement | SVGElement) {
  return new PropertyPartImpl(
    name,
    index,
    ({ value }) => {
      ;(element as any)[name] = value
    },
    element[name as keyof typeof element]
  )
}

export function makeTextPart(index: number, text: Text) {
  return new TextPartImpl(
    index,
    ({ value }) => {
      if (value) {
        text.nodeValue = convertCharacterEntities(value)
      } else {
        text.nodeValue = null
      }
    },
    text.nodeValue
  )
}

export function makeRefPart(index: number, ref: ElementSource) {
  return new RefPartImpl(index, identity, ref)
}

function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined
}

function diffStrings(
  previous: ReadonlyArray<string> | null | undefined,
  current: ReadonlyArray<string> | null | undefined
): { added: ReadonlyArray<string>; removed: ReadonlyArray<string>; unchanged: ReadonlyArray<string> } {
  if (previous == null || previous.length === 0) {
    return {
      added: current || [],
      removed: [],
      unchanged: []
    }
  } else if (current == null || current.length === 0) {
    return {
      added: [],
      removed: previous,
      unchanged: []
    }
  } else {
    const added = current.filter((c) => !previous.includes(c))
    const removed: Array<string> = []
    const unchanged: Array<string> = []

    for (let i = 0; i < previous.length; ++i) {
      if (current.includes(previous[i])) {
        unchanged.push(previous[i])
      } else {
        removed.push(previous[i])
      }
    }

    return {
      added,
      removed,
      unchanged
    }
  }
}

function diffDataSet(
  a: Record<string, string | undefined> | null | undefined,
  b: Record<string, string | undefined> | null | undefined
):
  | { added: Array<readonly [string, string | undefined]>; removed: ReadonlyArray<string> }
  | null
{
  if (!a) return b ? { added: Object.entries(b), removed: [] } : null
  if (!b) return { added: [], removed: Object.keys(a) }

  const { added, removed, unchanged } = diffStrings(Object.keys(a), Object.keys(b))

  return {
    added: added.concat(unchanged).map((k) => [k, b[k]] as const),
    removed
  }
}

// Sparse parts

export function handleSparseAttribute(
  name: string,
  element: HTMLElement | SVGElement,
  attr: Attr,
  parts: ReadonlyArray<AttrPartNode | TextNode>
) {
  const expected = parts.length

  let isSet = false
  const setValue = (value: string) => {
    if (value === "") {
      element.removeAttribute(name)
      isSet = false
    } else {
      attr.value = value
      if (isSet === false) {
        element.setAttributeNode(attr)
        isSet = true
      }
    }
  }

  const values = new Map<number, string | null | undefined>()

  const setValueIfReady = () => {
    if (values.size === expected) {
      let text = ""
      for (let i = 0; i < parts.length; ++i) {
        const value = values.get(i)
        text += value || ""
      }

      setValue(text)
    }
  }

  const out: Array<AttributePart> = []
  for (let i = 0; i < parts.length; ++i) {
    const index = i
    const part = parts[i]
    if (part._tag === "text") {
      values.set(i, part.value)
    } else {
      out.push(
        new AttributePartImpl(name, part.index, ({ value }) => {
          values.set(index, value)
          setValueIfReady()
        }, null)
      )
    }
  }

  setValueIfReady()

  return out
}

export function handleSparseClassName(
  element: HTMLElement | SVGElement,
  parts: ReadonlyArray<ClassNamePartNode | TextNode>
) {
  const expected = parts.length
  const values = new Map<number, ReadonlyArray<string>>()
  let previous = Array.from(element.classList)

  const setValueIfReady = () => {
    if (values.size === expected) {
      const next = Array.from(values.values()).flat(1)
      const { added, removed } = diffStrings(previous, next)
      element.classList.add(...added)
      element.classList.remove(...removed)
      previous = next
    }
  }

  const out: Array<ClassNamePart> = []
  for (let i = 0; i < parts.length; ++i) {
    const index = i
    const part = parts[i]
    if (part._tag === "text") {
      values.set(i, part.value ? part.value.split(" ") : [])
    } else {
      out.push(
        new ClassNamePartImpl(
          part.index,
          ({ value }) => {
            values.set(index, value)
            setValueIfReady()
          },
          []
        )
      )
    }
  }

  setValueIfReady()

  return out
}

export function handleSparseComment(
  comment: Comment,
  parts: ReadonlyArray<TextNode | CommentPartNode>
) {
  const expected = parts.length
  const values = new Map<number, string | null | undefined>()
  const setValueIfReady = () => {
    if (values.size === expected) {
      let text = ""
      for (let i = 0; i < parts.length; ++i) {
        const value = values.get(i)
        text += value || ""
      }
      comment.textContent = text
    }
  }

  const out: Array<CommentPart> = []
  for (let i = 0; i < parts.length; ++i) {
    const index = i
    const part = parts[i]
    if (part._tag === "text") {
      values.set(i, part.value)
    } else {
      out.push(
        new CommentPartImpl(part.index, ({ value }) => {
          values.set(index, value)
          setValueIfReady()
        }, null)
      )
    }
  }

  setValueIfReady()

  return out
}

// TODO: Node Part
// TODO: RenderQueue should be ammended to allow Ref's to only emit once they're inserted into the DOM
// TODO: Handle spread attributes/properties
// TODO: Helpers for attaching different data structures to parts
// TODO: Helpers for directives
// TODO: Sparse parts need some better support for scheduling updates together
// TODO: RenderQueue should be updated to ensure the highest-priority is used for a given part
// TODO: Hydration need to support nested fragments of elements
// TODO: Need to be able to configure replacement parts
// TODO: The start and end of Templates need to be marked
