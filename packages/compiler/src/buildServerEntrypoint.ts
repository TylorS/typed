import { readFileSync } from 'fs'

import type { Project } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildRenderableModule } from './buildRenderableModule.js'

// TODO: We need to better support where to read HTML file from.
// TODO: We should understand where the assetDirectory is

export function buildServerEntrypoint(
  sourceFileModules: SourceFileModule[],
  project: Project,
  htmlFilePath: string,
  outFile: string,
) {
  const entrypoint = buildRenderableModule(sourceFileModules, project, outFile)
  const html = readFileSync(htmlFilePath, 'utf-8').toString()
  const docType = `<!DOCTYPE ${parseDocType(html)}>`
  const httmlAttributes = parseHtmlAttributes(html)

  entrypoint.addImportDeclaration({
    moduleSpecifier: 'fs',
    namedImports: ['readFileSync'],
  })

  entrypoint.insertText(
    entrypoint.getFullWidth(),
    `
export const assetDirectory = null

export const html = readFileSync('${htmlFilePath}').toString()

export const htmlAttributes = ${JSON.stringify(httmlAttributes)}

export const docType = '${docType}'
    `,
  )

  const diagnostics = entrypoint.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    console.error(entrypoint.getFullText())

    throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics))
  }

  return entrypoint
}

function parseDocType(html: string) {
  const docTypeRegex = /<!DOCTYPE\s+(.+)>/i

  const docTypeMatch = html.match(docTypeRegex)

  return docTypeMatch ? docTypeMatch[1] : 'html'
}

function parseHtmlAttributes(html: string): Record<string, string> {
  const htmlAttributesRegex = /<html\s+([^>]+)>/i
  const htmlAttributesMatch = html.match(htmlAttributesRegex)

  if (!htmlAttributesMatch) return {}

  return Object.fromEntries(
    htmlAttributesMatch[1].split(/\s/g).map((kv) => {
      const [k, v = ''] = kv.split('=')

      return [k, v.replace(/"|'/g, '')]
    }),
  )
}
