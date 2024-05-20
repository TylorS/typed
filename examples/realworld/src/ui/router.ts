import { Fx, Navigation, Router } from "@typed/core"
import { isAuthenticated } from "@typed/realworld/services"
import { Effect } from "effect"
import { layout } from "./layout"
import * as pages from "./pages"

export const router = Router
  .match(pages.login.route, () => pages.login.main)
  .match(pages.article.route, pages.article.main)
  .match(pages.register.route, () => pages.register.main)
  .match(pages.settings.route, () => pages.settings.main)
  .match(pages.editor.route, () => pages.editor.main)
  .match(pages.editArticle.route, pages.editArticle.main)
  .match(pages.profile.route, pages.profile.main)
  .match(pages.home.route, pages.home.main)

const onNotFound = Effect.if(Fx.first(isAuthenticated), {
  onFalse: () => new Navigation.RedirectError({ path: pages.login.route.interpolate({}) }),
  onTrue: () => new Navigation.RedirectError({ path: pages.home.route.interpolate({}) })
})

export const main = layout(Router.notFoundWith(router, onNotFound))
