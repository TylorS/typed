export function parsePort(fallback = 3000): number {
  const port = process.env.PORT

  if (port === undefined) {
    return fallback
  }

  const parsedPort = parseInt(port, 10)

  if (Number.isNaN(parsedPort)) {
    return fallback
  }

  return parsedPort
}
