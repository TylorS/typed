import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { Effect } from "effect"
import { isAuthenticated } from "../services"
import { layout } from "./layout"
import * as pages from "./pages"

export const router = Router
  .match(pages.login.route, () => pages.login.main)
  .match(pages.article.route, pages.article.main)
  .match(pages.register.route, () => pages.register.main)
  .match(pages.settings.route, () => pages.settings.main)
  .match(pages.editArticle.route, () => pages.editArticle.main)
  .match(pages.editor.route, () => pages.editor.main)
  .match(pages.profile.route, pages.profile.main)
  .match(pages.profileFavorites.route, pages.profileFavorites.main)
  .match(pages.home.route, pages.home.main)

const onNotFound = Effect.gen(function*(_) {
  if (yield* _(isAuthenticated)) {
    return yield* _(new Navigation.RedirectError(pages.home.route))
  } else {
    return yield* _(new Navigation.RedirectError(pages.login.route))
  }
})

export const main = layout(Router.notFoundWith(router, onNotFound))
