import { isAuthenticatedGuard } from "@/ui/services/CurrentUser"
import * as Route from "@typed/route"

export const route = Route.fromPath("/", { match: { end: true } }).guard(isAuthenticatedGuard)
