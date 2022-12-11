import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { provideDomServices } from '../src/DOM/DomServices'
import { RenderContext, drainInto } from '../src/HTML'
import * as Router from '../src/Router/Router'

import { main } from './main'

const app = document.getElementById('app')

if (!app) {
  throw new Error('No app element found')
}

await pipe(
  main,
  drainInto(app),
  RenderContext.provideClient,
  Effect.provideSomeLayer(Router.routerLayer),
  provideDomServices(window),
  Effect.unsafeRunPromise,
)
