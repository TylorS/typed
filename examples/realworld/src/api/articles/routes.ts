import * as Route from "@typed/route"

export const articles = Route.fromPath("/articles")

export const article = Route.fromPath("/articles/:slug")

export const feed = Route.fromPath("/articles/feed")
