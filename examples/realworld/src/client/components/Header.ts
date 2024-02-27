import { IsAuthenticated } from "@/application"
import * as Fx from "@typed/fx"
import { AuthenticatedHeader } from "./AuthenticatedHeader"
import { UnauthenticatedHeader } from "./UnauthenticatedHeader"

export const Header = Fx.if(IsAuthenticated, {
  onFalse: UnauthenticatedHeader,
  onTrue: AuthenticatedHeader
})
