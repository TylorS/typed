import { Login, UserNotFoundError } from "@/services"
import { TreeFormatter } from "@effect/schema"
import { Effect } from "effect"
import { makeJwtUser } from "./common/MakeJwt"
import { DbServices } from "./db/Db"

export const LoginLive = Login.implement((input) =>
  Effect.gen(function*(_) {
    const Db = yield* _(DbServices)
    const dbUser = yield* _(Db.getUserByUsername(input.username), Effect.flatten)

    return yield* _(makeJwtUser(Db, dbUser))
  }).pipe(
    Effect.tapError((error) =>
      error._tag === "SchemaError" ? Effect.logError(TreeFormatter.formatIssue(error.error)) : Effect.logError(error)
    ),
    Effect.catchAll(() => new UserNotFoundError(input.username))
  )
)
