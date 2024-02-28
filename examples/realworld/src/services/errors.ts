import type { Email, JwtToken, User, Username } from "@/model"
import * as Data from "effect/Data"
import type { Option } from "effect/Option"

export class InvalidTokenError extends Data.TaggedError("InvalidTokenError") {
  constructor(readonly token: JwtToken) {
    super()
  }
}

export class PermissionDeniedError extends Data.TaggedError("PermissionDeniedError") {
  constructor(readonly token: JwtToken, readonly user: Option<User>) {
    super()
  }
}

export class ExistingEmailError extends Data.TaggedError("ExistingEmailError") {
  constructor(readonly email: Email) {
    super()
  }
}

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError") {
  constructor(readonly username: Username) {
    super()
  }
}
