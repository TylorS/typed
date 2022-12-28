import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export function getClientDirectory(importMetaUrl: string) {
  const directory = dirname(fileURLToPath(importMetaUrl))
  const clientDirectory = import.meta.env.PROD ? join(directory, '../client') : directory

  return clientDirectory
}
