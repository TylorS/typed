import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'

import { ModuleKind, Extension } from 'typescript'

import { VirtualModuleFile, VirtualModulePlugin } from './VirtualModulePlugin'
import { FileBuilder } from './file-builder'

const htmlPlugin: VirtualModulePlugin<null> = {
  name: '@typed/virtual-module/html',
  regex: /^html:(.+)$/,
  resolveVirtualModule: (id, importer) =>
    VirtualModuleFile({
      id,
      importer,
      fileName: resolve(dirname(importer), id.replace('html:', '') + '.html.__generated__.ts'),
      kind: ModuleKind.ES2020,
      extension: Extension.Ts,
    }),
  generateMetadata: () => null,
  generateContent: (vm) => {
    const builder = new FileBuilder()
    const content = findHtmlFile(vm as VirtualModuleFile)

    // TODO: Really generate the content
    // TODO: Use deasync to allow invoking viteDevServer.transformIndexHtml

    return builder.addText(`export const html: string = \`${content}\`;`).build()
  },
}

export = htmlPlugin

function findHtmlFile(vm: VirtualModuleFile) {
  const dir = dirname(vm.importer)
  const path = resolve(dir, vm.id.replace('html:', '') + '.html')

  return readFileSync(path, 'utf-8').toString()
}
