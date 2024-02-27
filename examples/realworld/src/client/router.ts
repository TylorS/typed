import { RefSubject } from "@typed/fx"
import * as Router from "@typed/router"
import { html } from "@typed/template"
import * as routes from "./routes"

export const router = Router
  .match(routes.loginRoute, () => html`<h1>Login</h1>`)
  .match(routes.registerRoute, () => html`<h1>Register</h1>`)
  .match(routes.settingsRoute, () => html`<h1>Settings</h1>`)
  .match(routes.editorRoute, () => html`<h1>Editor</h1>`)
  .match(
    routes.editArticleRoute,
    (params) => html`<h1>Edit Article: ${RefSubject.map(params, (p) => p.slug)}</h1>`
  )
  .match(
    routes.articleRoute,
    (params) => html`<h1>Article: ${RefSubject.map(params, (p) => p.slug)}</h1>`
  )
  .match(
    routes.profileRoute,
    (params) => html`<h1>Profile: ${RefSubject.map(params, (p) => p.username)}</h1>`
  )
  .match(
    routes.favoritesRoute,
    (params) => html`<h1>Favorites: ${RefSubject.map(params, (p) => p.username)}</h1>`
  )
  .match(
    routes.homeRoute,
    () => html`<h1>Home Page</h1>`
  )
