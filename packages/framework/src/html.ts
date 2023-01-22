import { join, relative } from 'path'

export function parseHtmlImports(sourceDirectory: string, content: string) {
  const imports: string[] = []

  const matches = content.match(/<script[^>]*src="([^"]*)"[^>]*>/g)

  if (matches) {
    for (const match of matches) {
      // If script is not type=module then skip
      if (!match.includes('type="module"')) {
        continue
      }

      const src = match.match(/src="([^"]*)"/)?.[1]

      if (src) {
        const fullPath = join(sourceDirectory, src)
        const relativePath = relative(sourceDirectory, fullPath)

        imports.push(relativePath)
      }
    }
  }

  return imports
}

export function parseBasePath(content: string) {
  const baseTag = content.match(/<base[^>]*>/)?.[0]

  if (baseTag) {
    const href = baseTag.match(/href="([^"]*)"/)?.[1]

    if (href) {
      return href
    }
  }

  return '/'
}
