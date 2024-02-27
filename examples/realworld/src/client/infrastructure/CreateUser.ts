import { CreateUser } from "@/application"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const CreateUserLive = CreateUser.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof CreateUser> = () => Effect.dieMessage("Not implemented")

  return create
}))

// function createPasswordHash(password: string): string {
//   const hash = createHash("sha256")
//   hash.update(password)
//   return hash.digest("hex")
// }
