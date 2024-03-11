import { client } from "@/api/client"
import { Articles } from "@/services"
import { Unprocessable } from "@/services/errors"
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
    ))
})
