import 'typed-query-selector/strict'

export type WindowEnv = {
  readonly window: Window
}

export type DocumentEnv = {
  readonly document: Document
}

export type RootElementEnv<Element extends ParentNode = ParentNode> = {
  readonly rootElement: Element
}

export type HistoryEnv = {
  readonly history: History
}

export type LocationEnv = {
  readonly location: Location
}
