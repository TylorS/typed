import { Effect } from "effect"
import { RouterBuilder } from "effect-http"
import { Spec } from "./spec"

export const server = RouterBuilder.make(Spec, { enableDocs: true, docsPath: "/docs" }).pipe(
  RouterBuilder.handle(
    "createArticle",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "createComment",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "deleteArticle",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "deleteComment",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "favorite",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "follow",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getArticle",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getArticles",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getComments",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getCurrentUser",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getFeed",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getProfile",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "getTags",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "login",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "register",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "unfavorite",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "unfollow",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "updateArticle",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.handle(
    "updateUser",
    () => Effect.succeed({ status: 422, content: { errors: ["Not implemented"] } } as const)
  ),
  RouterBuilder.build
)
