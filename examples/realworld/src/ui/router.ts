import * as Router from "@typed/router"
import { html } from "@typed/template"
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
  .match(pages.home.route, () => pages.home.main)
