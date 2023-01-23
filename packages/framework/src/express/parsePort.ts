export function parsePort(fallback = 3000): number {
  const port = import.meta.env.VITE_PORT

  if (port === undefined) {
    return fallback
  }

  const parsedPort = parseInt(port, 10)

  if (Number.isNaN(parsedPort)) {
    return fallback
  }

  return parsedPort
}

declare global {
  export interface ImportMetaEnv {
    VITE_PORT?: string
  }
}
