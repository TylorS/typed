import { dirname, join } from 'path'

import { ModuleKind, Extension } from 'typescript'

import { VirtualModuleFile, VirtualModulePlugin } from './VirtualModulePlugin'

const htmlPlugin: VirtualModulePlugin<null> = {
  name: '@typed/virtual-module/html',
  regex: /^html:(.+)$/,
  resolveVirtualModule: (id, importer) => {
    const dir = dirname(importer)

    return VirtualModuleFile({
      id,
      importer,
      fileName: join(dir, id.replace('html:', '') + '.html.__generated__.ts'),
      kind: ModuleKind.ES2020,
      extension: Extension.Ts,
    })
  },
  generateMetadata: () => null,
  // TODO: Really generate the content
  generateContent: () => `export const html: string = '<html></html>'`,
}

export = htmlPlugin
