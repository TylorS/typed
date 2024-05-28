import { Fx, hydrateToLayer, Navigation, Router } from "@typed/core"
import { isAuthenticated } from "@typed/realworld/services"
import { Effect } from "effect"
import * as Routes from "./common/routes"
import { layout } from "./layout"
import { router } from "./router"

const onNotFound = Effect.if(Fx.first(isAuthenticated), {
  onFalse: () => new Navigation.RedirectError({ path: Routes.login.interpolate({}) }),
  onTrue: () => new Navigation.RedirectError({ path: Routes.home.interpolate({}) })
})

export const UiClient = router.pipe(Router.notFoundWith(onNotFound), layout, hydrateToLayer)
