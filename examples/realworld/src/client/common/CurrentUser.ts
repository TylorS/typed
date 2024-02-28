import type { User } from "@/model"
import type * as AsyncData from "@typed/async-data/AsyncData"
import * as RefAsyncData from "@typed/fx/AsyncData"
import * as RefSubject from "@typed/fx/RefSubject"

export const CurrentUser = RefSubject.tagged<AsyncData.AsyncData<User>>()((_) =>
  class CurrentUser extends _("users/CurrentUser") {}
)
export type CurrentUser = RefSubject.Context<typeof CurrentUser>

export const IsAuthenticated = RefAsyncData.isSuccess(CurrentUser)

export const CurrentUsername = CurrentUser.pipe(
  RefAsyncData.getSuccess,
  RefSubject.map((_) => _.username)
)

export const CurrentUserImage = CurrentUser.pipe(
  RefAsyncData.getSuccess,
  RefSubject.map((_) => _.image)
)
