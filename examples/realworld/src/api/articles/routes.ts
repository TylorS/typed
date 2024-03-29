import { GetArticleInput } from "@/services/GetArticle"
import * as Route from "@typed/route"

export const articles = Route.literal("/articles")

export const article = Route.literal("/articles/:slug").pipe(Route.withSchema(GetArticleInput))

export const feed = Route.literal("/articles/feed")

export const favorites = article.concat(Route.literal("/favorite"))
