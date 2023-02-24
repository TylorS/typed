import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

export function writeAllOutputs(
  outputDirectory: string,
  pathsAndHtml: ReadonlyArray<readonly [string, string]>,
): Effect.Effect<never, never, void> {
  return pipe(
    pathsAndHtml,
    Effect.forEach(([path, html]) => writeHtmlFile(getHtmlFilePath(outputDirectory, path), html)),
  )
}

function writeHtmlFile(path: string, html: string): Effect.Effect<never, never, void> {
  return Effect.gen(function* ($) {
    yield* $(Effect.promise(() => mkdir(dirname(path), { recursive: true })))
    yield* $(Effect.promise(() => writeFile(path, html)))
  })
}

function getHtmlFilePath(outputDirectory: string, path: string): string {
  if (path === '/') {
    return join(outputDirectory, 'index.html')
  }

  const htmlFilePath = join(outputDirectory, path)

  if (htmlFilePath.endsWith('/')) {
    return htmlFilePath + 'index.html'
  }

  return htmlFilePath + '.html'
}
