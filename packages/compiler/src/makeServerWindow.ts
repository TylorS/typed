import { IncomingMessage } from 'http'
import { TLSSocket } from 'tls'

import { Window, GlobalThis } from '@typed/dom'
import * as happyDom from 'happy-dom'

export function makeServerWindow(req: IncomingMessage, origin: string = getOriginFromRequest(req)) {
  const url = new URL(req.url || '/', origin).toString()

  const win: Window & GlobalThis = new happyDom.Window({
    url,
  }) as any

  return win
}

export const html5Doctype = '<!DOCTYPE html>'

function getOriginFromRequest(req: IncomingMessage) {
  const proto =
    req.headers['x-forwarded-proto'] || ((req.socket as TLSSocket).encrypted ? 'https' : 'http')
  const host = req.headers['x-forwarded-host'] || req.headers.host

  return `${proto}://` + (host ?? `localhost`)
}
