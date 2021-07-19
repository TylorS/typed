import * as fastGlob from 'fast-glob'
import { readdirSync, readFileSync } from 'fs'
import { dirname, isAbsolute, join } from 'path'

export const ROOT_DIR = dirname(__dirname)
export const SOURCE_DIR = join(ROOT_DIR, 'src')

export const ROOT_FILES = ['exports']

export function compiledFiles(name: string): readonly string[] {
  const fileName = parseName(name)

  return [`/${fileName}.d.ts`, `/${fileName}.d.ts.map`, `/${fileName}.js`, `/${fileName}.js.map`]
}

export function parseName(name: string): string {
  return name.replace(/\.tsx?/, '')
}

export const MODULES: ReadonlyArray<string> = readdirSync(SOURCE_DIR)
  .sort()
  .filter(
    (x) => x !== 'internal.ts' && x !== 'index.ts' && !x.endsWith('.test.ts') && !x.startsWith('.'),
  )

export function getRelativeFile(directory: string, fileName: string) {
  return join(directory, fileName)
}

export function readRelativeFile(directory: string, fileName: string) {
  return readFileSync(getRelativeFile(directory, fileName)).toString()
}

export function findFilePaths(directory: string, fileGlobs: readonly string[]): string[] {
  return fastGlob
    .sync(Array.from(fileGlobs), { cwd: directory, onlyFiles: true })
    .map((x) => makeAbsolute(directory, x.toString()))
}

export function makeAbsolute(basePath: string, absoluteOrRelative: string): string {
  return isAbsolute(absoluteOrRelative) ? absoluteOrRelative : join(basePath, absoluteOrRelative)
}
