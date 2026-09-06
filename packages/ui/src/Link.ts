/**
 * Native anchors with selective same-origin Navigation interception.
 * Modified clicks, external links, downloads, and non-self targets retain native behavior.
 *
 * Read the [Link guide](/explore/ui-link) for a complete example.
 *
 * [APG interaction reference](https://www.w3.org/WAI/ARIA/apg/patterns/link/).
 * @since 1.0.0
 * @category Overview
 * @packageDocumentation
 */
import * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
import * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import { type NavigationError, Navigation } from "@typed/navigation";
import {
  EventHandler,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
  html,
} from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Native anchor options plus Typed navigation behavior.
 *
 * @remarks
 * `href` and content remain renderable, while `replace` selects history policy.
 * Ordinary anchor options—including target, download, rel, and user click
 * handlers—stay available through the DOM host model.
 * @since 1.0.0
 * @category Component options
 */
export type LinkOptions = Dom.HostOptions<HTMLAnchorElement> &
  Dom.ElementOptions<HTMLAnchorElement> & {
    readonly href: Renderable<string, any, any>;
    readonly content: Renderable<
      string | number | boolean | null | undefined | void | RenderEvent,
      any,
      any
    >;
    readonly replace?: boolean;
  };

type LinkError<Options extends object> = Renderable.ErrorFromObject<Options> | NavigationError;

type LinkServices<Options extends object> =
  | Renderable.ServicesFromObject<Options>
  | Navigation
  | Scope
  | RenderTemplate;

function makeLinkClickHandler(
  replace: boolean,
): EventHandler.EventHandler<MouseEvent, NavigationError, Navigation> {
  // Classification and native cancellation must run during event dispatch;
  // only the resulting router navigation is lazy.
  return EventHandler.make(
    (event: MouseEvent) => {
      const anchor = Dom.currentTarget<HTMLAnchorElement>(event);
      const href = anchor.href;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;
      const target = anchor.target;
      if (target && target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!isSafeLinkHref(href)) {
        event.preventDefault();
        return;
      }
      const destination = new URL(href);
      if (destination.protocol !== "http:" && destination.protocol !== "https:") return;
      if (destination.origin !== anchor.ownerDocument.defaultView?.location.origin) return;
      event.preventDefault();

      return Effect.flatMap(Navigation, (navigation) =>
        navigation.navigate(href, { history: replace ? "replace" : "push" }),
      );
    },
    { passive: false },
  );
}

function legacyProps(options: LinkOptions): Record<string, unknown> {
  const modern = options.props as Record<string, unknown> | undefined;
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (
      key === "content" ||
      key === "href" ||
      key === "props" ||
      key === "ref" ||
      key === "replace" ||
      key[0] === "@" ||
      (key[0] === "o" && key[1] === "n") ||
      (modern !== undefined && Object.hasOwn(modern, key))
    )
      continue;
    props[key] = value;
  }
  return props;
}

type LinkClickHandler = ReturnType<typeof makeLinkClickHandler>;
type LinkInternalProps<Options extends LinkOptions> = {
  readonly href: Options["href"];
  readonly onclick: LinkClickHandler;
};

function internalProps<const Options extends LinkOptions>(options: Options) {
  return (): LinkInternalProps<Options> =>
    ({
      ...legacyProps(options),
      href: sanitizeLinkHref(options.href),
      onclick: makeLinkClickHandler(options.replace ?? false),
    }) as LinkInternalProps<Options>;
}

/**
 * Renders a native anchor with safe, eligible same-origin SPA navigation.
 *
 * Modified clicks, downloads, external URLs, non-HTTP(S) destinations, and
 * non-self targets retain browser behavior. Unsafe executable schemes are
 * rendered as `about:blank` and their clicks are canceled. A user click handler
 * runs first through DOM host event chaining; `preventDefault()` prevents the
 * internal navigation decision.
 *
 * @remarks
 * `Link` keeps the anchor as the integration boundary: native opening, copying,
 * status previews, modifier keys, downloads, and external navigation continue
 * to work. Only an unmodified primary click to same-origin HTTP(S) is handed to
 * Typed's Effect-native `Navigation` service.
 *
 * Calling `Link` starts no work. Running the returned Fx subscribes to dynamic
 * href/content and installs a real, non-passive DOM click listener in its
 * Effect Scope. Scope finalization removes only those resources. Navigation
 * failures and required services remain visible in the Fx type. A custom host
 * must preserve the sanitized href, chained click handler, content, and native
 * anchor behavior.
 *
 * @example
 * ```ts
 * import { html } from "@typed/template";
 * import { Link } from "@typed/ui/Link";
 *
 * export const AccountLinks = html`<nav aria-label="Account">
 *     ${Link({ href: "/account/profile", content: "Edit profile" })}
 *     ${Link({
 *       href: "/account/security",
 *       content: "Security settings",
 *       replace: false,
 *     })}
 *     ${Link({
 *       href: "https://www.w3.org/WAI/",
 *       content: "Accessibility resources (opens in a new tab)",
 *       props: { target: "_blank", rel: "noopener" },
 *     })}
 *   </nav>`;
 * ```
 * @since 1.0.0
 * @category Native controls
 */
export function Link<const Options extends object>(
  options: Options,
  ..._: Options extends LinkOptions ? [] : ["Link options must satisfy LinkOptions"]
): Fx.Fx<RenderEvent, LinkError<Options>, LinkServices<Options>>;
export function Link<const Options extends object, const Host extends HostResult>(
  options: Options,
  host: Dom.HostOverride<Dom.HostProps<HTMLAnchorElement>, Renderable.Any, Host>,
  ..._: Options extends LinkOptions ? [] : ["Link options must satisfy LinkOptions"]
): Fx.Fx<
  RenderEvent,
  LinkError<Options> | Fx.Error<Host>,
  LinkServices<Options> | Fx.Services<Host>
>;
// Keep the implementation erased: constraining it to LinkOptions widens the
// Renderable `any` slots and loses the exact error/service inference above.
export function Link(options: any, host?: any, ..._: Array<any>): Fx.Fx<RenderEvent, any, any> {
  const render = Dom.renderHost<HTMLAnchorElement>() as (
    ...args: Array<any>
  ) => Fx.Fx<RenderEvent, any, any>;
  return render(
    options,
    host,
    internalProps(options),
    options.content,
    (props: any, content: any) => html`<a ...${props}>${content}</a>`,
  );
}

function sanitizeLinkHref<const Href extends Renderable<string, any, any>>(href: Href): Href {
  if (Fx.isFx(href)) return Fx.map(href, neutralizeExecutableHref) as Href;
  if (Stream.isStream(href)) {
    return Stream.map(href as Stream.Stream<string, any, any>, neutralizeExecutableHref) as Href;
  }
  if (Effect.isEffect(href)) return Effect.map(href, neutralizeExecutableHref) as Href;
  if (Array.isArray(href)) {
    return href.map((value) => sanitizeLinkHref(value)) as unknown as Href;
  }
  return (typeof href === "string" ? neutralizeExecutableHref(href) : href) as Href;
}

function neutralizeExecutableHref(href: string): string {
  return isSafeLinkHref(href) ? href : "about:blank";
}

function isSafeLinkHref(href: string): boolean {
  try {
    switch (new URL(href, "http://localhost").protocol) {
      case "http:":
      case "https:":
      case "mailto:":
      case "tel:":
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
