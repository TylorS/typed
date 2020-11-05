import { sync } from '@typed/fp/Resume/exports'
import { Patch } from '@typed/fp/Shared/exports'
import * as RD from 'react-dom'
import { render, Renderable } from 'uhtml'

export const patchReactEnv: Patch<Element | DocumentFragment, JSX.Element> = {
  patch: (node, renderable) => sync((RD.render(renderable, node), node)),
}

export const patchUhtmlEnv: Patch<Node, Renderable> = {
  patch: (node, renderable) => sync((render(node, renderable), node)),
}
