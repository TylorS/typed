import fastGlob from 'fast-glob'
import { readdirSync, readFileSync, statSync } from 'fs'
import { dirname, isAbsolute, join } from 'path'

export const ROOT_DIR = dirname(urlToDirname(import.meta.url))
export const SOURCE_DIR = join(ROOT_DIR, 'src')

export const ROOT_FILES = ['exports']

export function compiledFiles(name: string): readonly string[] {
  const fileName = parseName(name)

  return [`/${fileName}.d.ts`, `/${fileName}.d.ts.map`, `/${fileName}.js`, `/${fileName}.js.map`]
}

export function parseName(name: string): string {
  return name.replace(/\.tsx?/, '')
}

export const MODULES: ReadonlyArray<string> = readdirSync(SOURCE_DIR).filter((path) =>
  statSync(join(SOURCE_DIR, path)).isDirectory(),
)

export function urlToDirname(url: string) {
  return dirname(urlToFilename(url))
}

export function urlToFilename(url: string) {
  const u = new URL(url)

  return u.pathname
}

export function getRelativeFile(meta: ImportMeta, fileName: string) {
  return join(urlToDirname(meta.url), fileName)
}

export function readRelativeFile(meta: ImportMeta, fileName: string) {
  return readFileSync(getRelativeFile(meta, fileName)).toString()
}

export function findFilePaths(directory: string, fileGlobs: readonly string[]): string[] {
  return fastGlob
    .sync(Array.from(fileGlobs), { cwd: directory, onlyFiles: true })
    .map((x) => makeAbsolute(directory, x.toString()))
}

export function makeAbsolute(basePath: string, absoluteOrRelative: string): string {
  return isAbsolute(absoluteOrRelative) ? absoluteOrRelative : join(basePath, absoluteOrRelative)
}
