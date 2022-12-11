import * as Effect from '@effect/core/io/Effect'
import { Tag } from '@tsplus/stdlib/service/Tag'

export interface AuthService {
  readonly isAuthenticated: Effect.Effect<never, never, boolean>
}

export const AuthService = Tag<AuthService>()

export const isAuthenticated = Effect.serviceWithEffect(AuthService, (a) => a.isAuthenticated)
