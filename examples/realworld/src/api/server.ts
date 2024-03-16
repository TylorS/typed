import { Users } from "@/services"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { UpdateUser } from "@/services/UpdateUser"
import { Effect } from "effect"
import { RouterBuilder } from "effect-http"
import { Spec } from "./spec"

export const server = RouterBuilder.make(Spec, {}).pipe(
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
    (_, { jwtToken }) =>
      GetCurrentUser(jwtToken.token).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag("Unprocessable", (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const))
      )
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
    ({ body: { user } }) => {
      return Users.login(user).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag("Unprocessable", (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const))
      )
    }
  ),
  RouterBuilder.handle(
    "register",
    ({ body: { user } }) =>
      Users.register(user).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
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
    ({ body: { user } }) =>
      UpdateUser(user).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag("Unprocessable", (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const))
      )
  ),
  RouterBuilder.getRouter
)
