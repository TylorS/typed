import type * as Effect from "effect/Effect";
import type * as HttpRouter from "effect/unstable/http/HttpRouter";
import type * as HttpServerError from "effect/unstable/http/HttpServerError";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { html, type RenderTemplate } from "@typed/template";
import { ssrForHttp, streamingSsrForHttp } from "../HttpRouter.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type RenderFailure = { readonly _tag: "RenderFailure" };
type RenderService = { readonly RenderService: unique symbol };

declare const router: HttpRouter.HttpRouter;
declare const dynamic: Effect.Effect<string, RenderFailure, RenderService>;

const matcher = Matcher.empty.match(Route.Parse("page"), html`<main>${dynamic}</main>`);
const registration = ssrForHttp(router, matcher);
const curriedRegistration = ssrForHttp(matcher)(router);
const streamingRegistration = streamingSsrForHttp(router, matcher);
const curriedStreamingRegistration = streamingSsrForHttp(matcher)(router);

type _RegistrationErrors = Assert<Equal<Effect.Error<typeof registration>, never>>;
type _RegistrationServices = Assert<
  Equal<
    Effect.Services<typeof registration>,
    | RenderService
    | RenderTemplate
    | HttpRouter.Request.From<"Error", RenderFailure | HttpServerError.HttpServerError>
  >
>;
type _CurriedRegistrationServices = Assert<
  Equal<Effect.Services<typeof curriedRegistration>, Effect.Services<typeof registration>>
>;
type _StreamingRegistrationServices = Assert<
  Equal<Effect.Services<typeof streamingRegistration>, Effect.Services<typeof registration>>
>;
type _CurriedStreamingRegistrationServices = Assert<
  Equal<
    Effect.Services<typeof curriedStreamingRegistration>,
    Effect.Services<typeof registration>
  >
>;
