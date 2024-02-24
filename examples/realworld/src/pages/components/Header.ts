import * as Fx from "@typed/fx"
import { IsAuthenticated } from "../../application/services/CurrentUser"
import { AuthenticatedHeader } from "./AuthenticatedHeader"
import { UnauthenticatedHeader } from "./UnauthenticatedHeader"

export const Header = Fx.if(IsAuthenticated, {
  onFalse: UnauthenticatedHeader,
  onTrue: AuthenticatedHeader
})
