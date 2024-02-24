import * as Pg from "@sqlfx/pg"
import type * as Context from "@typed/context"
import { Effect, Option, Secret } from "effect"
import { UserRepository } from "../../application"
import type { Email, Password, User, Username } from "../../domain"
import { JwtToken } from "../../domain"

// TODO: Better error handling
// TODO: Real JWT
// TODO: Real database

export const UserRepositoryLayer = UserRepository.layer(Effect.gen(function*(_) {
  const sql = yield* _(Pg.tag)

  const fns: Context.Tagged.Service<typeof UserRepository> = {
    register: (input) =>
      Effect.suspend(() => {
        const token = JwtToken(Secret.fromString(`${input.username}:${input.email}`))
        const user: User = {
          email: input.email,
          username: input.username,
          token,
          bio: Option.none(),
          image: Option.none()
        }

        usersByEmail.set(user.email, user)
        userPasswords.set(user.email, input.password)
        userNameToEmail.set(user.username, user.email)
        jwts.set(Secret.value(token), user.email)

        return Effect.succeed(user)
      }),
    current: (token) =>
      Effect.suspend(() => {
        const email = jwts.get(Secret.value(token))
        const user = email != null ? usersByEmail.get(email) : undefined
        if (user != null) {
          return Effect.succeed(user)
        }

        return Effect.dieMessage("Invalid token")
      }),
    login: (input) =>
      Effect.suspend(() => {
        const email = userNameToEmail.get(input.username)
        const user = email != null ? usersByEmail.get(email) : undefined

        if (user != null && userPasswords.get(user.email) === input.password) {
          return Effect.succeed(user)
        }

        return Effect.dieMessage("Invalid username or password")
      }),
    update: (input, token) =>
      Effect.suspend(() => {
        const user = usersByEmail.get(input.email)
        const email = jwts.get(Secret.value(token))

        if (email == null || user?.email !== email) {
          return Effect.dieMessage("Invalid token")
        }

        if (user != null) {
          const updatedUser: User = {
            ...user,
            email: input.email,
            bio: Option.some(input.bio),
            image: input.image
          }

          usersByEmail.set(user.email, updatedUser)

          return Effect.succeed(updatedUser)
        }

        return Effect.dieMessage("User not found")
      })
  }

  return fns
}))
