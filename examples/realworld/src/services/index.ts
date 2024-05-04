import { CreateComment } from "@realworld/services/CreateComment"
import { DeleteArticle } from "@realworld/services/DeleteArticle"
import { DeleteComment } from "@realworld/services/DeleteComment"
import { FavoriteArticle } from "@realworld/services/FavoriteArticle"
import { FollowProfile } from "@realworld/services/FollowProfile"
import { GetArticle } from "@realworld/services/GetArticle"
import { GetArticles } from "@realworld/services/GetArticles"
import { GetComments } from "@realworld/services/GetComments"
import { GetCurrentUser } from "@realworld/services/GetCurrentUser"
import { GetFeed } from "@realworld/services/GetFeed"
import { GetProfile } from "@realworld/services/GetProfile"
import { GetTags } from "@realworld/services/GetTags"
import { Login } from "@realworld/services/Login"
import { Register } from "@realworld/services/Register"
import { UnfavoriteArticle } from "@realworld/services/UnfavoriteArticle"
import { UnfollowProfile } from "@realworld/services/UnfollowProfile"
import { UpdateArticle } from "@realworld/services/UpdateArticle"
import { UpdateUser } from "@realworld/services/UpdateUser"
import { repository } from "@typed/context/Repository"
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
