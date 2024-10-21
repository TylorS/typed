import { Route, Router } from "@typed/core"
import { router } from "./Router"

export const Main = router.pipe(Router.redirectTo(Route.home))
