import type { IncomingMessage } from 'http'
import type { TLSSocket } from 'tls'

export function getOriginFromRequest(req: IncomingMessage) {
  const proto =
    req.headers['x-forwarded-proto'] || ((req.socket as TLSSocket).encrypted ? 'https' : 'http')
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost`

  return `${proto}://` + host
}
