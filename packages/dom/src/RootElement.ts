import * as C from '@typed/context'

export interface RootElement {
  readonly rootElement: ParentNode & HTMLElement
}

export const RootElement = C.Tag<RootElement>('@typed/dom/RootElement')
