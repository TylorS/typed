import { Attributes, createElement } from 'react'

import { Pure } from '../Effect/Effect'
import { createHyperscript, HyperscriptEffectProps } from './createHyperscript'

// eslint-disable-next-line prettier/prettier
export type IsReactEventProp<T> = T extends `on${infer _}Capture` ? true : T extends `on${infer _}` ? true : false

export const ReactUri = '@typed/fp/hyperscript/React'
export type Reacturi = typeof ReactUri

declare module '@typed/fp/hyperscript/PropsMatch' {
  export interface PropsMatch<T> {
    [ReactUri]: IsReactEventProp<T>
  }
}

export const h = createHyperscript<typeof ReactUri>()(createElement)

const el = h('input', { onClick: (ev) => Pure.of(1) }, null)


type B = Attributes

type A = HyperscriptEffectProps<Reacturi, {}, { onClick: () => string }>


