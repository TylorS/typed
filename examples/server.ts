import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { pipe } from '@fp-ts/data/Function'
import { provideServerIntrinsics } from '@typed/framework/provideIntrinsics.js'
import { runPages } from '@typed/framework/runPages.js'
import express from 'express'
import * as happyDom from 'happy-dom'
import isbot from 'isbot'

import { Window, GlobalThis } from '@typed/dom/index.js'
import * as Fx from '@typed/fx/index.js'
import { renderInto } from '@typed/html/render.js'

// TODO: Determine how to insert the appropriate import statements.

const app = express()

const indexHtml = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'index.html'),
  'utf-8',
).toString()

const pages = import.meta.glob('./pages/**/*', { eager: true })

const html5Doctype = '<!DOCTYPE html>'

app.use(async (req, res, next) => {
  const win = makeServerWindow(req)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const application = win.document.getElementById('application')!

  try {
    await pipe(
      runPages(pages),
      renderInto(application),
      provideServerIntrinsics(win, win, {
        parentElement: application,
        isBot: isbot(req.get('user-agent') ?? ''),
      }),
      Fx.unsafeRunPromise,
    )

    res.status(200).end(html5Doctype + win.document.documentElement.outerHTML)
  } catch (e) {
    next(e)
  }
})

app.use((_req, res) => res.status(500).send('Internal Server Error'))

app.listen(3000, () => {
  console.log('Server listening on port 3000')
})

function makeServerWindow(req: express.Request) {
  const origin =
    `${req.protocol}://` + (req.get('x-forwarded-host') || req.get('host')) ?? `localhost`

  const url = new URL(req.url, origin).toString()

  const win: Window & GlobalThis = new happyDom.Window({
    url,
  }) as any

  const documentElement = win.document.documentElement

  // Can be replaced with any template engine
  documentElement.innerHTML = indexHtml.replace(/<html.+>/, '').replace('</html>', '')

  return win
}
