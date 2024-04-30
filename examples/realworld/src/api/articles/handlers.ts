import { catchUnauthorizedAndUnprocessable, catchUnprocessable, STATUS_200 } from "@/api/common/handlers"
import { Articles } from "@/services"
import { ServerRouterBuilder } from "@typed/server"
import { Effect, flow } from "effect"
import * as Spec from "./spec.js"

export const handleCreateArticle = Spec.createArticle.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { article } }) =>
    Articles.create(article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleDeleteArticle = Spec.deleteArticle.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { slug } }) => Articles.delete({ slug }).pipe(Effect.as(STATUS_200), catchUnauthorizedAndUnprocessable)
  )
)

export const handleFavoriteArticle = Spec.favorite.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { slug } }) => Articles.favorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleGetArticle = Spec.getArticle.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { slug } }) => Articles.get({ slug }).pipe(Effect.bindTo("article"), catchUnprocessable)
  )
)

export const handleGetArticles = Spec.getArticles.pipe(
  ServerRouterBuilder.fromEndpoint(({ query }) =>
    Articles.list(query).pipe(Effect.bindTo("articles"), catchUnprocessable)
  )
)

export const handleUnfavoriteArticle = Spec.unfavorite.pipe(
  ServerRouterBuilder.fromEndpoint(
    ({ path: { slug } }) => Articles.unfavorite(slug).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleUpdateArticle = Spec.updateArticle.pipe(
  ServerRouterBuilder.fromEndpoint(({ body: { article }, path: { slug } }) =>
    Articles.update(slug, article).pipe(Effect.bindTo("article"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleGetFeed = Spec.getFeed.pipe(
  ServerRouterBuilder.fromEndpoint(({ query }) =>
    Articles.feed(query).pipe(Effect.bindTo("articles"), catchUnauthorizedAndUnprocessable)
  )
)

export const handleArticles = flow(
  handleCreateArticle,
  handleDeleteArticle,
  handleFavoriteArticle,
  handleGetArticle,
  handleGetArticles,
  handleUnfavoriteArticle,
  handleUpdateArticle,
  handleGetFeed
)
