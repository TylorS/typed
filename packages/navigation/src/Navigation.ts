/**
 * @since 1.0.0
 */

import type * as HttpClient from "@effect/platform/HttpClient"
import { Parser, ParseResult } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import { Tagged } from "@typed/context"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Uuid } from "@typed/id"
import * as IdSchema from "@typed/id/Schema"
import type { Option, Scope } from "effect"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import type { Simplify } from "effect/Types"

/**
 * @since 1.0.0
 */
export interface Navigation {
  readonly origin: string

  readonly base: string

  readonly currentEntry: RefSubject.Computed<Destination>

  readonly entries: RefSubject.Computed<ReadonlyArray<Destination>>

  readonly transition: RefSubject.Computed<Option.Option<Transition>>

  readonly canGoBack: RefSubject.Computed<boolean>

  readonly canGoForward: RefSubject.Computed<boolean>

  readonly navigate: (
    url: string | URL,
    options?: NavigateOptions
  ) => Effect.Effect<Destination, NavigationError>

  readonly back: (options?: { readonly info?: unknown }) => Effect.Effect<Destination, NavigationError>

  readonly forward: (options?: { readonly info?: unknown }) => Effect.Effect<Destination, NavigationError>

  readonly traverseTo: (
    key: Destination["key"],
    options?: { readonly info?: unknown }
  ) => Effect.Effect<Destination, NavigationError>

  readonly updateCurrentEntry: (
    options: { readonly state: unknown }
  ) => Effect.Effect<Destination, NavigationError>

  readonly reload: (
    options?: { readonly info?: unknown; readonly state?: unknown }
  ) => Effect.Effect<Destination, NavigationError>

  readonly beforeNavigation: <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>

  readonly onNavigation: <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>

  readonly submit: (
    data: FormData,
    formInput?: Simplify<Omit<FormInputFrom, "data">>
  ) => Effect.Effect<
    Option.Option<HttpClient.response.ClientResponse>,
    NavigationError | HttpClient.error.HttpClientError,
    Scope.Scope | HttpClient.client.Client.Default
  >

  readonly onFormData: <R = never, R2 = never>(
    handler: FormDataHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>
}

/**
 * @since 1.0.0
 */
export const Navigation: Tagged<Navigation> = Tagged<Navigation, Navigation>("@typed/navigation/Navigation")

const urlSchema_ = Schema.instanceOf(URL).pipe(Schema.equivalence((a, b) => a.href === b.href))

const urlSchema = Schema.string.pipe(
  Schema.transformOrFail(
    urlSchema_,
    (s) =>
      Effect.suspend(() => {
        try {
          return Effect.succeed(new URL(s))
        } catch {
          return Effect.fail(ParseResult.type(urlSchema_.ast, s, `Expected a URL`))
        }
      }),
    (url) => Effect.succeed(url.toString())
  )
)

/**
 * @since 1.0.0
 */
export const Destination = Schema.struct({
  id: IdSchema.uuid,
  key: IdSchema.uuid,
  url: urlSchema,
  state: Schema.unknown,
  sameDocument: Schema.boolean
})

/**
 * @since 1.0.0
 */
export type DestinationJson = Schema.Schema.From<typeof Destination>
/**
 * @since 1.0.0
 */
export interface Destination extends Schema.Schema.To<typeof Destination> {}

/**
 * @since 1.0.0
 */
export const ProposedDestination = Destination.pipe(Schema.omit("id", "key"))

/**
 * @since 1.0.0
 */
export type ProposedDestinationJson = Schema.Schema.From<typeof ProposedDestination>
/**
 * @since 1.0.0
 */
export interface ProposedDestination extends Schema.Schema.To<typeof ProposedDestination> {}

/**
 * @since 1.0.0
 */
export const NavigationType = Schema.literal("push", "replace", "reload", "traverse")
/**
 * @since 1.0.0
 */
export type NavigationType = Schema.Schema.To<typeof NavigationType>

/**
 * @since 1.0.0
 */
export const Transition = Schema.struct({
  type: NavigationType,
  from: Destination,
  to: Schema.union(ProposedDestination, Destination)
})

/**
 * @since 1.0.0
 */
export type TransitionJson = Schema.Schema.From<typeof Transition>
/**
 * @since 1.0.0
 */
export interface Transition extends Schema.Schema.To<typeof Transition> {}

/**
 * @since 1.0.0
 */
export const BeforeNavigationEvent = Schema.struct({
  type: NavigationType,
  from: Destination,
  delta: Schema.number,
  to: Schema.union(ProposedDestination, Destination),
  info: Schema.unknown
})

/**
 * @since 1.0.0
 */
export type BeforeNavigationEventJson = Schema.Schema.From<typeof BeforeNavigationEvent>
/**
 * @since 1.0.0
 */
export interface BeforeNavigationEvent extends Schema.Schema.To<typeof BeforeNavigationEvent> {}

/**
 * @since 1.0.0
 */
export const NavigationEvent = Schema.struct({
  type: NavigationType,
  destination: Destination,
  info: Schema.unknown
})

/**
 * @since 1.0.0
 */
export type NavigationEventJson = Schema.Schema.From<typeof NavigationEvent>
/**
 * @since 1.0.0
 */
export interface NavigationEvent extends Schema.Schema.To<typeof NavigationEvent> {}

/**
 * @since 1.0.0
 */
export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<
  Option.Option<
    Effect.Effect<unknown, RedirectError | CancelNavigation, R2>
  >,
  RedirectError | CancelNavigation,
  R
>

/**
 * @since 1.0.0
 */
export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<
  Option.Option<
    Effect.Effect<unknown, never, R2>
  >,
  never,
  R
>

/**
 * @since 1.0.0
 */
export type FormDataHandler<R, R2> = (
  event: FormDataEvent
) => Effect.Effect<
  Option.Option<
    Effect.Effect<Option.Option<HttpClient.response.ClientResponse>, RedirectError | CancelNavigation, R2>
  >,
  RedirectError | CancelNavigation,
  R
>

/**
 * @since 1.0.0
 */
export class NavigationError extends Data.TaggedError("NavigationError")<{ readonly error: unknown }> {}

/**
 * @since 1.0.0
 */
export class RedirectError extends Data.TaggedError("RedirectError")<
  {
    readonly path: string | URL
    readonly options?: { readonly state?: unknown; readonly info?: unknown } | undefined
  }
> {}

/**
 * @since 1.0.0
 */
export class CancelNavigation extends Data.TaggedError("CancelNavigation")<{}> {}

/**
 * @since 1.0.0
 */
export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}

/**
 * @since 1.0.0
 */
export const FileSchemaFrom = Schema.struct({
  _id: Schema.literal("File"),
  name: Schema.string,
  data: Schema.string // Base64 encoded
})

/**
 * @since 1.0.0
 */
export type FileSchemaFrom = Schema.Schema.From<typeof FileSchemaFrom>

const decodeBase64 = Parser.decode(Schema.Base64)
const encodeBase64 = Parser.encode(Schema.Base64)

/**
 * @since 1.0.0
 */
export const FileSchema = FileSchemaFrom.pipe(
  Schema.transformOrFail(
    Schema.instanceOf(File),
    ({ data, name }) => Effect.map(decodeBase64(data), (buffer) => new File([buffer], name)),
    (file) =>
      Effect.promise(() => file.arrayBuffer()).pipe(
        Effect.flatMap((buffer) => encodeBase64(new Uint8Array(buffer))),
        Effect.map((data): FileSchemaFrom => ({ _id: "File", name: file.name, data }))
      )
  )
)

/**
 * @since 1.0.0
 */
export const FormDataSchema = Schema.record(Schema.string, Schema.union(Schema.string, FileSchema)).pipe(
  Schema.transform(
    Schema.instanceOf(FormData),
    (formData) => {
      const data = new FormData()

      for (const [key, value] of Object.entries(formData)) {
        if (value instanceof File) {
          data.append(key, value, value.name)
        } else {
          data.append(key, value)
        }
      }

      return data
    },
    (formData) => Object.fromEntries(formData.entries())
  )
)

const optionNullable = { as: "Option", nullable: true } as const

/**
 * @since 1.0.0
 */
export const FormInputSchema = Schema.struct({
  name: Schema.optional(Schema.string, optionNullable),
  action: Schema.optional(Schema.string, optionNullable),
  method: Schema.optional(Schema.string, optionNullable),
  encoding: Schema.optional(Schema.string, optionNullable),
  data: FormDataSchema
})

/**
 * @since 1.0.0
 */
export type FormInputFrom = Schema.Schema.From<typeof FormInputSchema>

/**
 * @since 1.0.0
 */
export interface FormInput extends Schema.Schema.To<typeof FormInputSchema> {}

/**
 * @since 1.0.0
 */
export const FormDataEvent = Schema.extend(Schema.struct({ from: Destination }), FormInputSchema)

/**
 * @since 1.0.0
 */
export type FormDataEventJson = Schema.Schema.From<typeof FormDataEvent>

/**
 * @since 1.0.0
 */
export interface FormDataEvent extends Schema.Schema.To<typeof FormDataEvent> {}

/**
 * @since 1.0.0
 */
export const cancelNavigation: CancelNavigation = new CancelNavigation()

/**
 * @since 1.0.0
 */
export function redirectToPath(
  path: string | URL,
  options?: { readonly state?: unknown; readonly info?: unknown }
): RedirectError {
  return new RedirectError({ path, options })
}

/**
 * @since 1.0.0
 */
export function isNavigationError(e: unknown): e is NavigationError {
  return e instanceof NavigationError
}

/**
 * @since 1.0.0
 */
export function isRedirectError(e: unknown): e is RedirectError {
  return e instanceof RedirectError
}

/**
 * @since 1.0.0
 */
export function isCancelNavigation(e: unknown): e is CancelNavigation {
  return e instanceof CancelNavigation
}

/**
 * @since 1.0.0
 */
export const navigate = (
  url: string | URL,
  options?: NavigateOptions
): Effect.Effect<Destination, NavigationError, Navigation> => Navigation.withEffect((n) => n.navigate(url, options))

/**
 * @since 1.0.0
 */
export const back: (options?: { readonly info?: unknown }) => Effect.Effect<Destination, NavigationError, Navigation> =
  (opts) => Navigation.withEffect((n) => n.back(opts))

/**
 * @since 1.0.0
 */
export const forward: (
  options?: { readonly info?: unknown }
) => Effect.Effect<Destination, NavigationError, Navigation> = (
  opts
) => Navigation.withEffect((n) => n.forward(opts))

/**
 * @since 1.0.0
 */
export const traverseTo: (
  key: Uuid,
  options?: { readonly info?: unknown }
) => Effect.Effect<Destination, NavigationError, Navigation> = (key, opts) =>
  Navigation.withEffect((n) => n.traverseTo(key, opts))

/**
 * @since 1.0.0
 */
export const updateCurrentEntry: (
  options: { readonly state: unknown }
) => Effect.Effect<Destination, NavigationError, Navigation> = (opts) =>
  Navigation.withEffect((n) => n.updateCurrentEntry(opts))

/**
 * @since 1.0.0
 */
export const reload: (
  options?: { readonly info?: unknown; readonly state?: unknown }
) => Effect.Effect<Destination, NavigationError, Navigation> = (
  opts
) => Navigation.withEffect((n) => n.reload(opts))

/**
 * @since 1.0.0
 */
export const CurrentEntry: RefSubject.Computed<Destination, never, Navigation> = RefSubject.computedFromTag(
  Navigation,
  (nav) => nav.currentEntry
)

/**
 * @since 1.0.0
 */
export function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string {
  return location.pathname + location.search + location.hash
}

/**
 * @since 1.0.0
 */
export const CurrentPath: RefSubject.Computed<string, never, Navigation> = RefSubject.map(
  CurrentEntry,
  (d) => getCurrentPathFromUrl(d.url)
)

/**
 * @since 1.0.0
 */
export const CurrentEntries: RefSubject.Computed<ReadonlyArray<Destination>, never, Navigation> = RefSubject
  .computedFromTag(
    Navigation,
    (n) => n.entries
  )

/**
 * @since 1.0.0
 */
export const CanGoForward: RefSubject.Computed<boolean, never, Navigation> = RefSubject.computedFromTag(
  Navigation,
  (n) => n.canGoForward
)

/**
 * @since 1.0.0
 */
export const CanGoBack: RefSubject.Computed<boolean, never, Navigation> = RefSubject.computedFromTag(
  Navigation,
  (n) => n.canGoBack
)

/**
 * @since 1.0.0
 */
export function handleRedirect(error: RedirectError) {
  return navigate(error.path, {
    history: "replace",
    ...error.options
  })
}

/**
 * @since 1.0.0
 */
export function submit(
  data: FormData,
  formInput?: Simplify<Omit<FormInputFrom, "data">>
): Effect.Effect<
  Option.Option<HttpClient.response.ClientResponse>,
  NavigationError | HttpClient.error.HttpClientError,
  Navigation | HttpClient.client.Client.Default | Scope.Scope
> {
  return Navigation.withEffect((n) => n.submit(data, formInput))
}

/**
 * @since 1.0.0
 */
export function onFormData<R = never, R2 = never>(
  handler: FormDataHandler<R, R2>
): Effect.Effect<void, never, Navigation | R | R2 | Scope.Scope> {
  return Navigation.withEffect((n) => n.onFormData(handler))
}
