import { promises } from 'fs'
import { dirname, join } from 'path'

import { left, right } from '@effect/data/Either'
import * as RA from '@effect/data/ReadonlyArray'

export async function readDirectory(directory: string): Promise<Directory> {
  const stat = await promises.stat(directory)

  if (stat.isFile()) {
    return {
      directory: dirname(directory),
      files: [directory],
      directories: [],
    }
  }

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
