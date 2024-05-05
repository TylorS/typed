import { repository } from "@typed/context/Repository"
import { CreateComment } from "@typed/realworld/services/CreateComment"
import { DeleteArticle } from "@typed/realworld/services/DeleteArticle"
import { DeleteComment } from "@typed/realworld/services/DeleteComment"
import { FavoriteArticle } from "@typed/realworld/services/FavoriteArticle"
import { FollowProfile } from "@typed/realworld/services/FollowProfile"
import { GetArticle } from "@typed/realworld/services/GetArticle"
import { GetArticles } from "@typed/realworld/services/GetArticles"
import { GetComments } from "@typed/realworld/services/GetComments"
import { GetCurrentUser } from "@typed/realworld/services/GetCurrentUser"
import { GetFeed } from "@typed/realworld/services/GetFeed"
import { GetProfile } from "@typed/realworld/services/GetProfile"
import { GetTags } from "@typed/realworld/services/GetTags"
import { Login } from "@typed/realworld/services/Login"
import { Register } from "@typed/realworld/services/Register"
import { UnfavoriteArticle } from "@typed/realworld/services/UnfavoriteArticle"
import { UnfollowProfile } from "@typed/realworld/services/UnfollowProfile"
import { UpdateArticle } from "@typed/realworld/services/UpdateArticle"
import { UpdateUser } from "@typed/realworld/services/UpdateUser"
import { CreateArticle } from "./CreateArticle"

export const Articles = repository({
  list: GetArticles,
  feed: GetFeed,
  get: GetArticle,
  create: CreateArticle,
  update: UpdateArticle,
  delete: DeleteArticle,
  favorite: FavoriteArticle,
  unfavorite: UnfavoriteArticle
})

export const Comments = repository({
  get: GetComments,
  create: CreateComment,
  delete: DeleteComment
})

export const Profiles = repository({
  get: GetProfile,
  follow: FollowProfile,
  unfollow: UnfollowProfile
})

export const Tags = repository({ get: GetTags })

export const Users = repository({
  current: GetCurrentUser,
  login: Login,
  register: Register,
  update: UpdateUser
})

export * from "./CurrentUser"
