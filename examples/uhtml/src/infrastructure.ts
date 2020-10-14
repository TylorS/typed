import { Patch } from '@typed/fp/patch/exports'
import { sync } from '@typed/fp/Resume/exports'
import { Hole, render } from 'uhtml'

export const patchMicroHtmlEnv: Patch<HTMLElement, Hole> = {
  patch: (node, renderable) => sync(render(node, renderable)),
}
