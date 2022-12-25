import { flow, pipe } from '@fp-ts/data/Function'
import {
  buildModules,
  Module,
  RedirectFallback,
  provideBrowserIntrinsics,
} from '@typed/framework/index.js'

import * as fallback from './pages/fallback.js'
import * as foo from './pages/foo.js'
import * as index from './pages/index.js'
import { layout } from './pages/layout.js'

import * as Fx from '@typed/fx/index.js'
import { renderInto } from '@typed/html/render.js'

const parentElementId = 'application'
let parentElement = document.querySelector<HTMLElement>(parentElementId)

if (!parentElement) {
  parentElement = document.createElement('div')
  parentElement.id = parentElementId
  document.body.appendChild(parentElement)
}

const modules = [
  Module.make(index.route, flow(index.main, Fx.provideSomeLayer(index.environment)), {
    layout,
  }),
  Module.make(foo.route, foo.main, {
    layout,
  }),
] as const

pipe(
  buildModules(modules, RedirectFallback(fallback.route)),
  renderInto(parentElement),
  provideBrowserIntrinsics(window, { parentElement }),
  Fx.unsafeRunAsync,
)
