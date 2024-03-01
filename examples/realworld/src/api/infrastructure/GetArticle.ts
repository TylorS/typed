import { GetArticle } from "@/services"
import { Effect } from "effect"

export const GetArticleLive = GetArticle.implement(() => Effect.dieMessage("Not implemented yet"))
