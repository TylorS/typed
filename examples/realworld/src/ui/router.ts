import * as Navigation from "@typed/navigation"
import { isAuthenticated } from "@typed/realworld/services"
import * as Router from "@typed/router"
import { Effect } from "effect"
import { layout } from "./layout"
import * as pages from "./pages"

export const router = Router
  .match(pages.login.route, () => pages.login.main)
  .match(pages.article.route, pages.article.main)
  .match(pages.register.route, () => pages.register.main)
  .match(pages.settings.route, () => pages.settings.main)
  .match(pages.editArticle.route, pages.editArticle.main)
  .match(pages.editor.route, () => pages.editor.main)
  .match(pages.profile.route, pages.profile.main)
  .match(pages.home.route, pages.home.main)

const onNotFound = Effect.if(isAuthenticated, {
  onFalse: () => new Navigation.RedirectError(pages.login.route),
  onTrue: () => new Navigation.RedirectError(pages.home.route)
})

export const main = layout(Router.notFoundWith(router, onNotFound))
