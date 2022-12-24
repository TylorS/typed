import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import {
  buildModules,
  Module,
  RedirectFallback,
  provideIntrinsics,
} from '@typed/framework/index.js'

import * as fallback from './pages/fallback.js'
import * as foo from './pages/foo.js'
import * as index from './pages/index.js'
import { layout } from './pages/layout.js'

import * as Fx from '@typed/fx/index.js'
import { runBrowser } from '@typed/html/render.js'

pipe(
  buildModules(
    [
      Module.make(foo.route, () => foo.main, {
        layout,
      }),
      Module.make(index.route, () => pipe(index.main, Fx.provideSomeLayer(index.environment)), {
        layout,
      }),
    ],
    RedirectFallback(fallback.route),
  ),
  provideIntrinsics('browser')(window, window),
  runBrowser(document.body),
  Fx.drain,
  Effect.unsafeRunAsync,
)
