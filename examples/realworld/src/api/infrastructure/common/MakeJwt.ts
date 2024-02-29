import type { DbServices, DbUser } from "@/api/infrastructure/db/Db"
import type { User } from "@/model"
import { JwtToken } from "@/model"
import { Fn } from "@typed/context"
import { Clock, Config, Effect, Secret } from "effect"
import JWT from "jsonwebtoken"
import { dbUserToUser } from "../db/conversions"

const JwtSecret = Config.succeed("replace_me_with_a_real_secret")

const MakeJwt_ = Fn<(user: DbUser) => Effect.Effect<JwtToken>>()((_) => class MakeJwt extends _("MakeJwt") {})

export const MakeJwt = Object.assign(MakeJwt_, {
  Live: MakeJwt_.layer(Effect.gen(function*(_) {
    const secret = yield* _(JwtSecret)
    return (user: DbUser) =>
      Effect.sync(() => JwtToken(Secret.fromString(JWT.sign(user, secret, { expiresIn: "24h" }))))
  }))
})

export type MakeJwt = Fn.Identifier<typeof MakeJwt_>

export const makeJwtUser = (Db: DbServices, dbUser: DbUser, token?: JwtToken) =>
  Effect.gen(function*(_) {
    if (!token) {
      token = yield* _(MakeJwt.apply(dbUser))
      const timestamp = new Date(yield* _(Clock.currentTimeMillis))

      yield* _(Db.saveJwt({
        user_email: dbUser.email,
        jwt: token,
        created_at: timestamp,
        expires_at: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000),
        revoked: false
      }))
    }

    return dbUserToUser(dbUser, token)
  })

const VerifyJwt_ = Fn<(token: JwtToken) => Effect.Effect<User>>()((_) => class VerifyJwt extends _("VerifyJwt") {})

export const VerifyJwt = Object.assign(VerifyJwt_, {
  Live: VerifyJwt_.layer(Effect.gen(function*(_) {
    const secret = yield* _(JwtSecret)
    return (token: JwtToken) =>
      Effect.sync(() => {
        const { payload } = JWT.verify(Secret.value(token), secret, { complete: true })
        const user = payload as JWT.JwtPayload

        return {
          email: user.email,
          username: user.username,
          bio: user.bio,
          image: user.image,
          token
        }
      })
  }))
})
