import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { Navigation, type NavigationError } from "@typed/navigation";
import { EventHandler, type RenderEvent, type RenderTemplate } from "@typed/template";
import { Link } from "../Link.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type ClickError = { readonly _tag: "ClickError" };
type ClickService = { readonly ClickService: unique symbol };
type HostError = { readonly _tag: "HostError" };
type HostService = { readonly HostService: unique symbol };

declare const onclick: EventHandler.EventHandler<Event, ClickError, ClickService>;
declare const classes: Fx.Fx<string, never, ClickService>;

const link = Link({ href: "/", content: "Home", onclick });

type _LinkErrors = Assert<Equal<Fx.Error<typeof link>, ClickError | NavigationError>>;
type _LinkServices = Assert<
  Equal<Fx.Services<typeof link>, ClickService | Navigation | Scope.Scope | RenderTemplate>
>;

const dynamicClass = Link({ href: "/", content: "Home", class: classes });

type _DynamicClassServices = Assert<
  Equal<Fx.Services<typeof dynamicClass>, ClickService | Navigation | Scope.Scope | RenderTemplate>
>;

const staticLink = Link({ href: "/", content: "Home" });

type _StaticLinkServices = Assert<
  Equal<Fx.Services<typeof staticLink>, Navigation | Scope.Scope | RenderTemplate>
>;

declare const hostResult: Fx.Fx<RenderEvent, HostError, HostService>;
const hostedLink = Link({ href: "/", content: "Home" }, () => hostResult);

type _HostedLinkErrors = Assert<Equal<Fx.Error<typeof hostedLink>, NavigationError | HostError>>;
type _HostedLinkServices = Assert<
  Equal<Fx.Services<typeof hostedLink>, Navigation | Scope.Scope | RenderTemplate | HostService>
>;

const inferredHandler = EventHandler.make(() => undefined, { preventDefault: true });

type _InferredHandlerServices = Assert<Equal<EventHandler.Services<typeof inferredHandler>, never>>;

const inferredClick = Link({
  href: "/",
  content: "Home",
  onclick: inferredHandler,
});

type _InferredClickServices = Assert<
  Equal<Fx.Services<typeof inferredClick>, Navigation | Scope.Scope | RenderTemplate>
>;
