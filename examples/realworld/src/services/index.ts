import { DeleteArticle } from "@/services/DeleteArticle"
import { GetArticle } from "@/services/GetArticle"
import { GetArticles } from "@/services/GetArticles"
import { GetFeed } from "@/services/GetFeed"
import { UpdateArticle } from "@/services/UpdateArticle"
import { repository } from "@typed/context"
import { CreateArticle } from "./CreateArticle"

export const Articles = repository(
  {
    list: GetArticles,
    feed: GetFeed,
    get: GetArticle,
    create: CreateArticle,
    update: UpdateArticle,
    delete: DeleteArticle
  }
)
