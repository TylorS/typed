import { Effect, Secret } from "effect"
import { RouterBuilder } from "effect-http"
import * as App from "../application/services"
import { JwtToken } from "../domain"
import { RealworldApiSpec } from "./spec"

export const RealworldApiServer = RouterBuilder.make(RealworldApiSpec, { enableDocs: true }).pipe(
  RouterBuilder.handle("login", ({ body }) => Effect.bindTo(App.Login.apply(body.user), "user")),
  RouterBuilder.handle(
    "getCurrentUser",
    (_, { jwtTokenAuth }) => Effect.bindTo(App.GetCurrentUser.apply(parseJwtToken(jwtTokenAuth.token)), "user")
  ),
  RouterBuilder.handle("register", ({ body }) => Effect.bindTo(App.CreateUser.apply(body.user), "user")),
  RouterBuilder.handle(
    "updateCurrentUser",
    ({ body }, { jwtTokenAuth }) =>
      Effect.bindTo(App.UpdateUser.apply(body.user, parseJwtToken(jwtTokenAuth.token)), "user")
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ params }) => Effect.bindTo(App.GetProfile.apply(params.username), "profile")
  ),
  RouterBuilder.handle(
    "followUser",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.FollowUser.apply(params.username, parseJwtToken(jwtTokenAuth.token)), "profile")
  ),
  RouterBuilder.handle(
    "unfollowUser",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.UnfollowUser.apply(params.username, parseJwtToken(jwtTokenAuth.token)), "profile")
  ),
  RouterBuilder.handle("getArticles", ({ query }) => Effect.bindTo(App.GetArticles.apply(query), "articles")),
  RouterBuilder.handle("getFeed", ({ query }) => Effect.bindTo(App.GetFeed.apply(query), "articles")),
  RouterBuilder.handle("getArticle", ({ params }) => Effect.bindTo(App.GetArticle.apply(params.slug), "article")),
  RouterBuilder.handle(
    "createArticle",
    ({ body }, { jwtTokenAuth }) =>
      Effect.bindTo(App.CreateArticle.apply(body.article, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body, params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.UpdateArticle.apply(params.slug, body.article, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "deleteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.DeleteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "favoriteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.FavoriteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "unfavoriteArticle",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.UnfavoriteArticle.apply(params.slug, parseJwtToken(jwtTokenAuth.token)), "article")
  ),
  RouterBuilder.handle(
    "addComment",
    ({ body, params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.AddComment.apply(params.slug, body.comment, parseJwtToken(jwtTokenAuth.token)), "comment")
  ),
  RouterBuilder.handle(
    "listComments",
    ({ params }) => Effect.bindTo(App.GetComments.apply(params.slug), "comments")
  ),
  RouterBuilder.handle(
    "deleteComment",
    ({ params }, { jwtTokenAuth }) =>
      Effect.bindTo(App.DeleteComment.apply(params.slug, params.id, parseJwtToken(jwtTokenAuth.token)), "comment")
  ),
  RouterBuilder.handle("listTags", () => Effect.bindTo(App.GetTags.apply(), "tags")),
  RouterBuilder.build
)

const parseJwtToken = (token: JwtToken): JwtToken => {
  const v = Secret.value(token)
  // Remove the "Bearer " or "Token " prefix
  return JwtToken(Secret.fromString(v.split(" ")[1]))
}
