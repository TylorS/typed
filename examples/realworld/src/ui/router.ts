import * as Router from "@typed/router"
import { html } from "@typed/template"
import * as pages from "./pages"

const notImplemented = () => html`<div>Not Implemented</div>`

export const router = Router
  .match(pages.login.route, notImplemented)
  .match(pages.home.route, notImplemented)
  .match(pages.article.route, notImplemented)
  .match(pages.register.route, notImplemented)
  .match(pages.settings.route, notImplemented)
  .match(pages.editArticle.route, notImplemented)
  .match(pages.editor.route, notImplemented)
  .match(pages.profile.route, notImplemented)
  .match(pages.profileFavorites.route, notImplemented)
