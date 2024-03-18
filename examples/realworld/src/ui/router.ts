import * as Router from "@typed/router"
import { html } from "@typed/template"
import * as pages from "./pages"

export const router = Router
  .match(pages.login.route, () => pages.login.main)
  .match(pages.article.route, () => html`<div>Article</div>`)
  .match(pages.register.route, () => pages.register.main)
  .match(pages.settings.route, () => html`<div>Settings</div>`)
  .match(pages.editArticle.route, () => html`<div>Edit Article</div>`)
  .match(pages.editor.route, () => html`<div>Editor</div>`)
  .match(pages.profile.route, () => html`<div>Profile</div>`)
  .match(pages.profileFavorites.route, () => html`<div>Profile Favorites</div>`)
  .match(pages.home.route, () => html`<div>Home</div>`)
