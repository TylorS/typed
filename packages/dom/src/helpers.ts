import type * as TQS from 'typed-query-selector/parser.js'

export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR]
  ? Fallback
  : Fallback extends globalThis.Element
  ? TQS.ParseSelector<T, Fallback>
  : Fallback

export type DefaultEventMap<T> = T extends Window
  ? WindowEventMap
  : T extends Document
  ? DocumentEventMap
  : T extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : T extends HTMLMediaElement
  ? HTMLMediaElementEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : T extends SVGElement
  ? SVGElementEventMap
  : T extends Element
  ? ElementEventMap
  : Readonly<Record<string, unknown>>

export const ROOT_CSS_SELECTOR = `:root` as const
