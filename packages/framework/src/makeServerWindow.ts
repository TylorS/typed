import type { IncomingMessage } from 'http'
import type { TLSSocket } from 'tls'

import type { Window, GlobalThis } from '@typed/dom'
import * as happyDom from 'happy-dom'

export interface ServerWindowOptions {
  readonly innerWidth?: number
  readonly innerHeight?: number
  readonly url?: string
  readonly settings?: {
    readonly disableJavaScriptEvaluation: boolean
    readonly disableJavaScriptFileLoading: boolean
    readonly disableCSSFileLoading: boolean
    readonly enableFileSystemHttpRequests: boolean
  }
}

export function makeServerWindow(
  req: IncomingMessage,
  options?: ServerWindowOptions,
): Window & GlobalThis & Pick<InstanceType<typeof happyDom.Window>, 'happyDOM'> {
  const url = options?.url ?? new URL(req.url || '/', getOriginFromRequest(req)).toString()

  const win: Window & GlobalThis & Pick<InstanceType<typeof happyDom.Window>, 'happyDOM'> =
    new happyDom.Window({
      ...options,
      url,
    }) as any

  return win
}

export const html5Doctype = '<!DOCTYPE html>'

function getOriginFromRequest(req: IncomingMessage) {
  const proto =
    req.headers['x-forwarded-proto'] || ((req.socket as TLSSocket).encrypted ? 'https' : 'http')
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost`

  return `${proto}://` + host
}
