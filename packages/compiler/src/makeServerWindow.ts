import { Window, GlobalThis } from '@typed/dom'
import express from 'express'
import * as happyDom from 'happy-dom'

export function makeServerWindowFromExpress(
  req: express.Request,
  origin: string = getOriginFromRequest(req),
) {
  const url = new URL(req.url, origin).toString()

  const win: Window & GlobalThis = new happyDom.Window({
    url,
  }) as any

  return win
}

export const html5Doctype = '<!DOCTYPE html>'

function getOriginFromRequest(req: express.Request) {
  return `${req.protocol}://` + (req.get('x-forwarded-host') || req.get('host')) ?? `localhost`
}
