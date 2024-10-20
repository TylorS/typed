/**
 * @since 1.0.0
 */

import type { HttpClientError, HttpClientResponse } from "@effect/platform"
import type * as HttpClient from "@effect/platform/HttpClient"
import { ParseResult } from "@effect/schema"
import * as Equivalence from "@effect/schema/Equivalence"
import * as Schema from "@effect/schema/Schema"
import { Tagged } from "@typed/context"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Uuid } from "@typed/id"
import * as IdSchema from "@typed/id/Schema"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import type * as Option from "effect/Option"
import type * as Scope from "effect/Scope"
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
    Option.Option<HttpClientResponse.HttpClientResponse>,
    NavigationError | HttpClientError.HttpClientError,
    Scope.Scope | HttpClient.HttpClient.Service
  >

  readonly onFormData: <R = never, R2 = never>(
    handler: FormDataHandler<R, R2>
  ) => Effect.Effect<void, never, R | R2 | Scope.Scope>
}

/**
 * @since 1.0.0
 */
export const Navigation: Tagged<Navigation> = Tagged<Navigation, Navigation>("@typed/navigation/Navigation")

const urlSchema_ = Schema.instanceOf(URL).pipe(Equivalence.equivalence(() => (a, b) => a.href === b.href))

const urlSchema = Schema.String.pipe(
  Schema.transformOrFail(
    urlSchema_,
    {
      decode: (s) =>
        Effect.suspend(() => {
          try {
            return Effect.succeed(new URL(s))
          } catch {
            return Effect.fail(new ParseResult.Type(urlSchema_.ast, s, `Expected a URL`))
          }
        }),
      encode: (url) => Effect.succeed(url.toString())
    }
  )
)

/**
 * @since 1.0.0
 */
export const Destination = Schema.Struct({
  id: IdSchema.uuid,
  key: IdSchema.uuid,
  url: urlSchema,
  state: Schema.Unknown,
  sameDocument: Schema.Boolean
})

/**
 * @since 1.0.0
 */
export type DestinationJson = Schema.Schema.Encoded<typeof Destination>
/**
 * @since 1.0.0
 */
export interface Destination extends Schema.Schema.Type<typeof Destination> {}

/**
 * @since 1.0.0
 */
export const ProposedDestination = Destination.pipe(Schema.omit("id", "key"))

/**
 * @since 1.0.0
 */
export type ProposedDestinationJson = Schema.Schema.Encoded<typeof ProposedDestination>
/**
 * @since 1.0.0
 */
export interface ProposedDestination extends Schema.Schema.Type<typeof ProposedDestination> {}

/**
 * @since 1.0.0
 */
export const NavigationType = Schema.Literal("push", "replace", "reload", "traverse")
/**
 * @since 1.0.0
 */
export type NavigationType = Schema.Schema.Type<typeof NavigationType>

/**
 * @since 1.0.0
 */
export const Transition = Schema.Struct({
  type: NavigationType,
  from: Destination,
  to: Schema.Union(ProposedDestination, Destination)
})

/**
 * @since 1.0.0
 */
export type TransitionJson = Schema.Schema.Encoded<typeof Transition>
/**
 * @since 1.0.0
 */
export interface Transition extends Schema.Schema.Type<typeof Transition> {}

/**
 * @since 1.0.0
 */
export const BeforeNavigationEvent = Schema.Struct({
  type: NavigationType,
  from: Destination,
  delta: Schema.Number,
  to: Schema.Union(ProposedDestination, Destination),
  info: Schema.Unknown
})

/**
 * @since 1.0.0
 */
export type BeforeNavigationEventJson = Schema.Schema.Encoded<typeof BeforeNavigationEvent>
/**
 * @since 1.0.0
 */
export interface BeforeNavigationEvent extends Schema.Schema.Type<typeof BeforeNavigationEvent> {}

/**
 * @since 1.0.0
 */
export const NavigationEvent = Schema.Struct({
  type: NavigationType,
  destination: Destination,
  info: Schema.Unknown
})

/**
 * @since 1.0.0
 */
export type NavigationEventJson = Schema.Schema.Encoded<typeof NavigationEvent>
/**
 * @since 1.0.0
 */
export interface NavigationEvent extends Schema.Schema.Type<typeof NavigationEvent> {}

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
    Effect.Effect<Option.Option<HttpClientResponse.HttpClientResponse>, RedirectError | CancelNavigation, R2>
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
export const FileSchemaFrom = Schema.Struct({
  _id: Schema.Literal("File"),
  name: Schema.String,
  data: Schema.String // Base64 encoded
})

/**
 * @since 1.0.0
 */
export type FileSchemaFrom = Schema.Schema.Encoded<typeof FileSchemaFrom>

const decodeBase64 = ParseResult.decode(Schema.Uint8ArrayFromBase64Url)
const encodeBase64 = ParseResult.encode(Schema.Uint8ArrayFromBase64Url)

/**
 * @since 1.0.0
 */
export const FileSchema = FileSchemaFrom.pipe(
  Schema.transformOrFail(
    Schema.instanceOf(File),
    {
      decode: ({ data, name }) => Effect.map(decodeBase64(data), (buffer) => new File([buffer], name)),
      encode: (file) =>
        Effect.promise(() => file.arrayBuffer()).pipe(
          Effect.flatMap((buffer) => encodeBase64(new Uint8Array(buffer))),
          Effect.map((data): FileSchemaFrom => ({ _id: "File", name: file.name, data }))
        )
    }
  )
)

/**
 * @since 1.0.0
 */
export const FormDataSchema = Schema.Record({ key: Schema.String, value: Schema.Union(Schema.String, FileSchema) })
  .pipe(
    Schema.transform(
      Schema.instanceOf(FormData),
      {
        decode: (formData) => {
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
        encode: (formData) => Object.fromEntries(formData.entries())
      }
    )
  )

const optionNullable = { as: "Option", nullable: true } as const

/**
 * @since 1.0.0
 */
export const FormInputSchema = Schema.Struct({
  name: Schema.optionalWith(Schema.String, optionNullable),
  action: Schema.optionalWith(Schema.String, optionNullable),
  method: Schema.optionalWith(Schema.String, optionNullable),
  encoding: Schema.optionalWith(Schema.String, optionNullable),
  data: FormDataSchema
})

/**
 * @since 1.0.0
 */
export type FormInputFrom = Schema.Schema.Encoded<typeof FormInputSchema>

/**
 * @since 1.0.0
 */
export interface FormInput extends Schema.Schema.Type<typeof FormInputSchema> {}

/**
 * @since 1.0.0
 */
export const FormDataEvent = Schema.extend(Schema.Struct({ from: Destination }), FormInputSchema)

/**
 * @since 1.0.0
 */
export type FormDataEventJson = Schema.Schema.Encoded<typeof FormDataEvent>

/**
 * @since 1.0.0
 */
export interface FormDataEvent extends Schema.Schema.Type<typeof FormDataEvent> {}

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
export const CurrentPath: RefSubject.Computed<string, never, Navigation> = RefSubject.computedFromTag(
  Navigation,
  (nav) => RefSubject.map(nav.currentEntry, (e) => getCurrentPathFromUrl(e.url))
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
  Option.Option<HttpClientResponse.HttpClientResponse>,
  NavigationError | HttpClientError.HttpClientError,
  Navigation | HttpClient.HttpClient.Service | Scope.Scope
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
