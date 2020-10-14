import { Patch } from '@typed/fp/patch/exports'
import { sync } from '@typed/fp/Resume/exports'
import { render, Renderable } from 'uhtml'

export const patchMicroHtmlEnv: Patch<Node, Renderable> = {
  patch: (node, renderable) => sync(render(node, renderable)),
}
