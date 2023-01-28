import { relative } from 'path'

export function getRelativePath(from: string, to: string) {
  const path = relative(from, to)

  if (!path.startsWith('.')) {
    return './' + path
  }

  return path
}
