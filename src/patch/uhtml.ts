import { sync } from '@typed/fp/Resume/exports'
import { render, Renderable } from 'uhtml'

import { Patch } from './Patch'

export const patchMicroHtmlEnv: PatchMicroHtmlEnv = {
  patch: (node, renderable) => sync(render(node, renderable)),
}

export type PatchMicroHtmlEnv = Patch<Node, Renderable>
