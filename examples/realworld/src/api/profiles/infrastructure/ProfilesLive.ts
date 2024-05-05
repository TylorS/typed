import { Schema } from "@effect/schema"
import * as Pg from "@effect/sql-pg"
import { getCurrentJwtUser, getOptionalCurrentJwtUser } from "@typed/realworld/api/common/infrastructure/CurrentJwt"
import { catchExpectedErrors } from "@typed/realworld/api/common/infrastructure/errors"
import { DbProfile, DbUser } from "@typed/realworld/api/common/infrastructure/schema"
import type { Profile, UserId } from "@typed/realworld/model"
import { Username } from "@typed/realworld/model"
import { Profiles } from "@typed/realworld/services"
import { Effect, Option } from "effect"

export const ProfilesLive = Profiles.implement({
  get: (username) =>
    Effect.gen(function*(_) {
      const user = yield* _(getOptionalCurrentJwtUser)
      return yield* _(getProfileByUsername(username, user.pipe(Option.map((u) => u.id), Option.getOrUndefined)))
    }).pipe(catchExpectedErrors),
  follow: (username) =>
    Effect.gen(function*(_) {
      const currentUser = yield* _(getCurrentJwtUser)
      const sql = yield* _(Pg.client.PgClient)
      const user = yield* _(getDbUserByUsername(username))

      yield* _(sql`insert into follows (follower_id, followed_id) values (${currentUser.id}, ${user.id});`)

      return {
        email: user.email,
        username,
        bio: Option.fromNullable(user.bio),
        image: Option.fromNullable(user.image),
        following: true
      }
    }).pipe(catchExpectedErrors),
  unfollow: (username) =>
    Effect.gen(function*(_) {
      const currentUser = yield* _(getCurrentJwtUser)
      const sql = yield* _(Pg.client.PgClient)
      const user = yield* _(getDbUserByUsername(username))

      yield* _(sql`delete from follows where follower_id = ${currentUser.id} and followed_id = ${user.id};`)

      return {
        email: user.email,
        username,
        bio: Option.fromNullable(user.bio),
        image: Option.fromNullable(user.image),
        following: false
      }
    }).pipe(catchExpectedErrors)
})

function getProfileByUsername(username: Username, userId?: UserId) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.client.PgClient)

    const dbProfile = yield* _(
      username,
      Pg.schema.single(
        {
          Request: Username,
          Result: DbProfile.pipe(Schema.extend(Schema.Struct({ following: Schema.Boolean }))),
          execute: (name) =>
            userId ?
              sql`
        SELECT u.email as email, u.username as username, u.bio as bio, u.image as image, exists(select 1 from follows f where f.follower_id = ${userId} and f.followed_id = u.id) as following
        FROM users u
        WHERE u.username = ${name};
      ` :
              sql`
        SELECT u.email as email, u.username as username, u.bio as bio, u.image as image, false as following
        FROM users u
        WHERE u.username = ${name};
      `
        }
      )
    )

    return dbProfileToProfile(dbProfile)
  })
}

function getDbUserByUsername(username: Username) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.client.PgClient)
    return yield* _(
      username,
      Pg.schema.single({
        Request: Username,
        Result: DbUser,
        execute: (t) => sql`select * from users where username = ${t}`
      })
    )
  })
}

function dbProfileToProfile(db: DbProfile & { readonly following: boolean }): Profile {
  return {
    email: db.email,
    username: db.username,
    bio: Option.fromNullable(db.bio),
    image: Option.fromNullable(db.image),
    following: db.following
  }
}
