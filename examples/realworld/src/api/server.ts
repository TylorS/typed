import { Articles, Comments, Profiles, Tags, Users } from "@/services"
import { GetCurrentUser } from "@/services/GetCurrentUser"
import { UpdateUser } from "@/services/UpdateUser"
import { Effect } from "effect"
import { RouterBuilder } from "effect-http"
import { Spec } from "./spec"

export const server = RouterBuilder.make(Spec, {}).pipe(
  RouterBuilder.handle(
    "createArticle",
    ({ body: { article } }) =>
      Articles.create(article).pipe(
        Effect.map((article) => ({ status: 201, content: { article } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "createComment",
    ({ body: { comment }, params: { slug } }) =>
      Comments.create(slug, comment).pipe(
        Effect.map((comment) => ({ status: 201, content: { comment } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "deleteArticle",
    ({ params: { slug } }) =>
      Articles.delete({ slug }).pipe(
        Effect.map(() => ({ status: 200 } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "deleteComment",
    ({ params: { id, slug } }) =>
      Comments.delete(slug, { id }).pipe(
        Effect.map(() => ({ status: 200 } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "favorite",
    ({ params: { slug } }) =>
      Articles.favorite(slug).pipe(
        Effect.map((article) => ({ status: 200, content: { article } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "follow",
    ({ params: { username } }) =>
      Profiles.follow(username).pipe(
        Effect.map((profile) => ({ status: 200, content: { profile } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getArticle",
    ({ params: { slug } }) =>
      Articles.get({ slug }).pipe(
        Effect.map((article) => ({ status: 200, content: { article } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getArticles",
    ({ query }) =>
      Articles.list(query).pipe(
        Effect.map((articles) => ({ status: 200, content: { articles } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getComments",
    ({ params: { slug } }) =>
      Comments.get(slug).pipe(
        Effect.map((comments) => ({ status: 200, content: { comments } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getCurrentUser",
    (_) =>
      GetCurrentUser().pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getFeed",
    ({ query }) =>
      Articles.feed(query).pipe(
        Effect.map((articles) => ({ status: 200, content: { articles } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "getProfile",
    ({ params: { username } }) =>
      Profiles.get(username).pipe(
        Effect.map((profile) => ({ status: 200, content: { profile } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  )
).pipe(
  RouterBuilder.handle(
    "getTags",
    () =>
      Tags.get().pipe(
        Effect.map((tags) => ({ status: 200, content: { tags } } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "login",
    ({ body: { user } }) => {
      return Users.login(user).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
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
    ({ params: { slug } }) =>
      Articles.unfavorite(slug).pipe(
        Effect.map((article) => ({ status: 200, content: { article } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "unfollow",
    ({ params: { username } }) =>
      Profiles.unfollow(username).pipe(
        Effect.map((profile) => ({ status: 200, content: { profile } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "updateArticle",
    ({ body: { article }, params: { slug } }) =>
      Articles.update(slug, article).pipe(
        Effect.map((article) => ({ status: 200, content: { article } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  ),
  RouterBuilder.handle(
    "updateUser",
    ({ body: { user } }) =>
      UpdateUser(user).pipe(
        Effect.map((user) => ({ status: 200, content: { user } } as const)),
        Effect.catchTag("Unauthorized", () => Effect.succeed({ status: 401 } as const)),
        Effect.catchTag(
          "Unprocessable",
          (e) => Effect.succeed({ status: 422, content: { errors: e.errors } } as const)
        )
      )
  )
).pipe(
  RouterBuilder.getRouter
)
