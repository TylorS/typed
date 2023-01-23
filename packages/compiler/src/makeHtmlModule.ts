import { EOL } from 'os'
import { dirname, join, relative } from 'path'

import { minify } from 'html-minifier'
import type { Project, SourceFile } from 'ts-morph'

import { cleanHtml } from './cleanHtml.js'
import { addNamedImport, appendText } from './ts-morph-helpers.js'

export interface HtmlModuleOptions {
  readonly project: Project
  readonly base: string
  readonly filePath: string
  readonly html: string
  readonly importer: string
  readonly serverOutputDirectory: string
  readonly clientOutputDirectory: string
  readonly build: 'development' | 'production' | 'static'
}

export async function makeHtmlModule(options: HtmlModuleOptions): Promise<SourceFile> {
  const {
    project,
    base,
    filePath,
    html,
    importer,
    serverOutputDirectory,
    clientOutputDirectory,
    build,
  } = options
  const tsPath = `${filePath}.__generated__.ts`
  const sourceFile = project.createSourceFile(
    tsPath,
    `/* File auto-generated by @typed/compiler */`,
    { overwrite: true },
  )

  const docType = `<!DOCTYPE ${parseDocType(html)}>`
  const htmlAttributes = parseHtmlAttributes(html)

  addNamedImport(
    sourceFile,
    ['makeServerWindow', 'type ServerWindowOptions'],
    '@typed/framework/makeServerWindow',
  )

  appendText(
    sourceFile,
    EOL +
      `export const assetDirectory: string = '${
        build === 'development'
          ? dirname(importer)
          : getRelativePath(serverOutputDirectory, clientOutputDirectory)
      }'`,
  )

  appendText(sourceFile, EOL + `export const docType: string = \`${docType.trim()}\``)

  appendText(
    sourceFile,
    EOL + `export const htmlAttributes: Record<string, string> = ${JSON.stringify(htmlAttributes)}`,
  )

  appendText(sourceFile, EOL + `export const basePath: string = '${base}'`)

  appendText(sourceFile, EOL + (await generateHtmlExport(html, docType)))

  appendText(
    sourceFile,
    EOL +
      `export function makeWindow(options: ServerWindowOptions): ReturnType<typeof makeServerWindow> {
  const win = makeServerWindow(options)
  const documentElement = win.document.documentElement

  documentElement.innerHTML = html

  for (const [key, value] of Object.entries(htmlAttributes)) {
    documentElement.setAttribute(key, value)
  }

  return win
}`,
  )

  return sourceFile
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

async function generateHtmlExport(html: string, docType: string) {
  html = minify(html, { sortAttributes: true, sortClassName: true })
  html = cleanHtml(html, docType)

  return `export const html: string = \`${html}\``
}

function getRelativePath(serverOutputDirectory: string, clientOutputDirectory: string) {
  let relativeClientOutput = relative(serverOutputDirectory, clientOutputDirectory)

  if (!relativeClientOutput.startsWith('.')) {
    relativeClientOutput = `./${relativeClientOutput}`
  }

  return relativeClientOutput
}

export function addOrUpdateBase(html: string, base: string) {
  base = removeTrailingSlash(base)

  const baseHrefRegex = /<base(.*)href=["|'](.*)["|'](.*)>/i
  const matches = html.match(baseHrefRegex)

  if (matches) {
    return html.replace(
      baseHrefRegex,
      `<base${matches[1]}href="${join(base, matches[2])}"${matches[3]}>`,
    )
  }

  return html.replace('</head>', `  <base href="${base}" />${EOL}</head>`)
}

function removeTrailingSlash(path: string) {
  if (path === '/') return path

  return path.endsWith('/') ? path.slice(0, -1) : path
}
