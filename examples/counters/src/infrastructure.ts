import { Patch } from '@typed/fp/patch/exports'
import { sync } from '@typed/fp/Resume/exports'
import { render } from 'react-dom'

export const patchReactEnv: Patch<Element | DocumentFragment, JSX.Element> = {
  patch: (node, renderable) => sync((render(renderable, node), node)),
}
