import { Schema } from "@effect/schema"
import { Route } from "@typed/core"
import { HttpApiEndpoint, HttpApiGroup } from "@typed/server"
import { Effect } from "effect"

export const GetArticlesRoute = Route.literal("articles")
export const GetArticles = HttpApiEndpoint.get("getArticles", GetArticlesRoute).pipe(
  HttpApiEndpoint.setSuccess(Schema.String)
)
export const GetArticlesHandler = HttpApiEndpoint.handle(GetArticles, () => Effect.succeed("hello, world"))

export const Articles = HttpApiGroup.make("Articles").pipe(
  HttpApiGroup.add(GetArticles)
)

export const ArticlesApi = HttpApiGroup.build(Articles, (handlers) => handlers.pipe(GetArticlesHandler))
