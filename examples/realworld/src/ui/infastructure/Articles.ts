import { client } from "@/api/client"
import { Articles } from "@/services"
import { Unauthorized, Unprocessable } from "@/services/errors"
import { getCurrentJwtToken } from "@/ui/services"
import { Effect } from "effect"

export const ArticlesLive = Articles.implement({
  get: (input) =>
    Effect.gen(function*(_) {
      const response = yield* _(client.getArticle({ params: input }))
      switch (response.status) {
        case 200:
          return response.content.article
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    )),
  create: (input) =>
    Effect.gen(function*(_) {
      const jwtToken = yield* _(getCurrentJwtToken)
      const response = yield* _(client.createArticle({ body: { article: input } }, { jwtToken }))
      switch (response.status) {
        case 201:
          return response.content.article
        case 401:
          return yield* _(Effect.fail(new Unauthorized()))
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    )),
  update: (slug, input) =>
    Effect.gen(function*(_) {
      const jwtToken = yield* _(getCurrentJwtToken)
      const response = yield* _(client.updateArticle({ params: { slug }, body: { article: input } }, { jwtToken }))
      switch (response.status) {
        case 200:
          return response.content.article
        case 401:
          return yield* _(Effect.fail(new Unauthorized()))
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    )),
  delete: (input) =>
    Effect.gen(function*(_) {
      const jwtToken = yield* _(getCurrentJwtToken)
      const response = yield* _(client.deleteArticle({ params: input }, { jwtToken }))
      switch (response.status) {
        case 200:
          return
        case 401:
          return yield* _(Effect.fail(new Unauthorized()))
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    )),
  list: (input) =>
    Effect.gen(function*(_) {
      const response = yield* _(client.getArticles({ params: input }))
      switch (response.status) {
        case 200:
          return response.content.articles
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    )),
  feed: (input) =>
    Effect.gen(function*(_) {
      const response = yield* _(client.getFeed({ params: input }))
      switch (response.status) {
        case 200:
          return response.content.articles
        case 401:
          return yield* _(Effect.fail(new Unauthorized()))
        case 422:
          return yield* _(Effect.fail(new Unprocessable(response.content.errors)))
      }
    }).pipe(Effect.catchTag(
      "ClientError",
      (error) => Effect.fail(new Unprocessable([error.message]))
    ))
})
