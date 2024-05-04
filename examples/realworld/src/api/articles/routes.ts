import { GetArticleInput } from "@realworld/services/GetArticle"
import * as Route from "@typed/route"

export const articles = Route.literal("articles")

export const article = Route.literal("articles").concat(Route.param("slug")).pipe(Route.withSchema(GetArticleInput))

export const feed = articles.concat(Route.literal("feed"))

export const favorites = article.concat(Route.literal("favorite"))
