const fallbackRegex = /fallback\.(ts|js)x?$/
const layoutRegex = /layout\.(ts|js)x?$/
const environemntRegex = /environment\.(ts|js)x?$/

export function isFallbackFileName(fileName: string): boolean {
  return fallbackRegex.test(fileName)
}

export function isLayoutFileName(fileName: string): boolean {
  return layoutRegex.test(fileName)
}

export function isEnvironmentFileName(fileName: string): boolean {
  return environemntRegex.test(fileName)
}
