import { promises } from 'fs'
import { join } from 'path'

import { left, right } from '@fp-ts/data/Either'
import * as RA from '@fp-ts/data/ReadonlyArray'

export async function readDirectory(directory: string): Promise<Directory> {
  const paths = await promises.readdir(directory)
  const [files, directories] = RA.separate(
    await Promise.all(
      paths.map(async (p) => {
        const filePath = join(directory, p)
        const stat = await promises.stat(filePath)

        if (stat.isDirectory()) {
          return right(filePath)
        }

        return left(filePath)
      }),
    ),
  )

  return {
    directory,
    files,
    directories: await Promise.all(directories.map(readDirectory)),
  }
}

export interface Directory {
  readonly directory: string
  readonly files: readonly string[]
  readonly directories: readonly Directory[]
}
