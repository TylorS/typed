import { DbLive } from "@/api/common/infrastructure/db"
import { Layer } from "effect"

export const Live = Layer.mergeAll(DbLive)
