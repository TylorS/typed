import { basename, dirname, resolve } from 'path'

import { VirtualModulePlugin } from '../virtual-module'

const browserRegex = /^browser:(.+)/

export const BrowserPlugin: VirtualModulePlugin = {
  name: '@typed/virtual/browser',
  match: browserRegex,
  resolveFileName: ({ id, importer }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, path] = browserRegex.exec(id)!
    const dir = dirname(importer)
    const name = `${basename(path)}.browser.__generated__.ts`
    return resolve(dir, name)
  },
  createContent: () => {
    // TODO: Generate content from module tree

    return `import * as Fx from '@typed/fx'
    
    export declare function render(element: HTMLElement): Fx.Fx<never, never, HTMLElement>`
  },
}
