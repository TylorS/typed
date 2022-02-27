import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'

import * as S from '../src/Prelude/Sync'

findEmptyDirectories(join(__dirname, '../src')).forEach((d) => rimraf.sync(d))

function findEmptyDirectories(base: string): readonly string[] {
  return S.run(readDirs(base))
}

function readDirs(base: string): S.Sync<readonly string[]> {
  return S.Sync(function* () {
    const dirs = yield* S.fromLazy(() =>
      readdirSync(base)
        .map((p) => join(base, p))
        .filter((path) => statSync(path).isDirectory()),
    )
    const emptyDirs: string[] = []
    const nonEmptyDirs: string[] = []

    for (const dir of dirs) {
      const files = yield* readFiles(dir)

      if (files.length === 0) {
        emptyDirs.push(dir)
      } else {
        nonEmptyDirs.push(dir)
      }
    }

    for (const dir of nonEmptyDirs) {
      emptyDirs.push(...(yield* readDirs(dir)))
    }

    return emptyDirs
  })
}

function readFiles(base: string) {
  return S.fromLazy(() =>
    readdirSync(base)
      .map((p) => join(base, p))
      .filter((path) => statSync(path).isFile()),
  )
}
