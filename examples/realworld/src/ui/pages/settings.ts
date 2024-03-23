import { isAuthenticatedGuard } from "@/services"
import * as Route from "@typed/route"

export const route = Route.fromPath("/settings").pipe(Route.guard(isAuthenticatedGuard))
