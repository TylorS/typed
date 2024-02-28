import { Login } from "@/services"
import type * as Context from "@typed/context"
import { Effect } from "effect"

// eslint-disable-next-line require-yield
export const LoginLive = Login.layer(Effect.gen(function*(_) {
  const create: Context.Tagged.Service<typeof Login> = () => Effect.dieMessage("Not implemented")

  return create
}))
