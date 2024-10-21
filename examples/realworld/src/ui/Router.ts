import { html, Route, Router } from "@typed/core"

export const router = Router.match(
  Route.home,
  () => html`<h1>Home</h1>`
)
