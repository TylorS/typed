import { JwtToken } from "@/model"
import * as Services from "@/services"
import { Effect, Secret } from "effect"
import { RouterBuilder } from "effect-http"
import { Spec } from "./spec"

export const Server = RouterBuilder.make(Spec, { enableDocs: true }).pipe(
  RouterBuilder.handle("login", ({ body }) => Effect.bindTo(Services.Login.apply(body.user), "user")),
  RouterBuilder.handle(
    "getCurrentUser",
    (_, { jwtTokenAuth }) => Effect.bindTo(Services.GetCurrentUser.apply(parseJwtToken(jwtTokenAuth.token)), "user")
  ),
  RouterBuilder.handle("register", ({ body }) => Effect.bindTo(Services.CreateUser.apply(body.user), "user")),
  RouterBuilder.handle(
    "updateCurrentUser",
    ({ body }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.UpdateUser.apply(body.user, parseJwtToken(jwtTokenAuth.token)), "user")
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ params }) => Effect.bindTo(Services.GetProfile.apply(params.username), "profile")
  ),
  RouterBuilder.handle(
    "followUser",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.FollowUser.apply(params.username, parseJwtToken(jwtTokenAuth.token)), "profile")
  ),
  RouterBuilder.handle(
    "unfollowUser",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.UnfollowUser.apply(params.username, parseJwtToken(jwtTokenAuth.token)), "profile")
  ),
  RouterBuilder.handle("getArticles", ({ query }) => Effect.bindTo(Services.GetArticles.apply(query), "articles")),
  RouterBuilder.handle("getFeed", ({ query }) => Effect.bindTo(Services.GetFeed.apply(query), "articles")),
  RouterBuilder.handle("getArticle", ({ params }) => Effect.bindTo(Services.GetArticle.apply(params.slug), "article")),
  RouterBuilder.handle(
    "createArticle",
    ({ body }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.CreateArticle.apply(body.article, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body, params }, { jwtTokenAuth }) =>
      Effect.bindTo(
        Services.UpdateArticle.apply(params.slug, body.article, parseJwtToken(jwtTokenAuth.token)),
        "article"
      )
  ),
  RouterBuilder.handle(
    "deleteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.DeleteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "favoriteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.FavoriteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "unfavoriteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.UnfavoriteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "addComment",
    ({ body, params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.AddComment.apply(params.slug, body.comment, parseJwtToken(jwtTokenAuth.token)), "comment")
  ),
  RouterBuilder.handle(
    "listComments",
    ({ params }) => Effect.bindTo(Services.GetComments.apply(params.slug), "comments")
  ),
  RouterBuilder.handle(
    "deleteComment",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(Services.DeleteComment.apply(params.slug, params.id, parseJwtToken(jwtTokenAuth.token)), "comment")
  ),
  RouterBuilder.handle("listTags", () => Effect.bindTo(Services.GetTags.apply(), "tags")),
  RouterBuilder.build
)

const parseJwtToken = (token: JwtToken): JwtToken => {
  const v = Secret.value(token)
  // Remove the "Bearer " or "Token " prefix
  return JwtToken(Secret.fromString(v.split(" ")[1]))
}
