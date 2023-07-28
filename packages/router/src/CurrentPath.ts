import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { Router, getCurrentPathFromUrl } from './router.js'

const getCurrentPathFromRouter = <P extends string>(router: Router<P>) =>
  router.navigation.currentEntry.map((entry) => getCurrentPathFromUrl(entry.url))

export const CurrentPath: Effect.Effect<Router<string>, never, string> &
  Fx.Fx<Router<string>, never, string> = Object.assign(
  Router.withEffect(getCurrentPathFromRouter),
  Router.withFx(getCurrentPathFromRouter),
)
